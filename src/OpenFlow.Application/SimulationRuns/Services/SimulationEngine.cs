using OpenFlow.Application.Abstractions;
using OpenFlow.Application.Executions.Services;
using OpenFlow.Contracts.Executions;
using OpenFlow.Contracts.SimulationRuns;
using OpenFlow.Domain.Common;
using OpenFlow.Domain.Executions;
using OpenFlow.Domain.Scheduling;
using OpenFlow.Domain.Simulation;
using DomainTaskStatus = OpenFlow.Domain.Scheduling.TaskStatus;

namespace OpenFlow.Application.SimulationRuns.Services;

public class SimulationEngine : ISimulationEngine
{
    private readonly IApplicationDbContext _db;
    private readonly ISimulationClock _clock;
    private readonly IWorkflowExecutionEngine _executionEngine;
    private readonly IFixtureRegistry _fixtureRegistry;

    public SimulationEngine(
        IApplicationDbContext db,
        ISimulationClock clock,
        IWorkflowExecutionEngine executionEngine,
        IFixtureRegistry fixtureRegistry)
    {
        _db = db;
        _clock = clock;
        _executionEngine = executionEngine;
        _fixtureRegistry = fixtureRegistry;
    }

    public async Task<Result<SimulationResultDto>> StartSimulationAsync(StartSimulationRequest request, CancellationToken ct = default)
    {
        if (request.Fixtures != null && request.Fixtures.Count > 0)
        {
            _fixtureRegistry.RegisterFixtures(request.Fixtures);
        }

        var modeStr = request.Mode?.Trim() ?? "FastSimulation";
        SimulationMode mode;
        if (modeStr.Equals("Step", StringComparison.OrdinalIgnoreCase) || modeStr.Equals("StepMode", StringComparison.OrdinalIgnoreCase))
        {
            mode = SimulationMode.StepMode;
        }
        else if (!Enum.TryParse(modeStr, true, out mode))
        {
            mode = SimulationMode.FastSimulation;
        }
        var startUtc = _clock.UtcNow;
        var run = new SimulationRun(Guid.NewGuid(), request.WorkflowVersionId, mode, startUtc, request.InitialStateJson, startUtc);
        _db.SimulationRuns.Add(run);

        var startResult = await _executionEngine.StartExecutionAsync(
            request.WorkflowVersionId,
            run.Id,
            request.SubjectId,
            request.InitialStateJson,
            ct);

        if (startResult.IsFailure)
        {
            return Result<SimulationResultDto>.Failure(startResult.Error);
        }

        var execution = startResult.Value!;
        var maxCutoffUtc = startUtc.AddDays(Math.Max(1, request.MaxVirtualDays));

        // In FastSimulation mode, fast-forward through all scheduled tasks automatically
        if (mode == SimulationMode.FastSimulation)
        {
            const int maxResumptions = 50;
            int resumptionCount = 0;

            while (execution.Status == ExecutionStatus.Waiting && resumptionCount < maxResumptions)
            {
                resumptionCount++;
                var nextTask = _db.ScheduledTasks
                    .Where(t => t.ExecutionId == execution.Id && t.Status == DomainTaskStatus.Pending)
                    .OrderBy(t => t.DueAtUtc)
                    .FirstOrDefault();

                if (nextTask == null || nextTask.DueAtUtc > maxCutoffUtc)
                {
                    break;
                }

                _clock.SetTime(nextTask.DueAtUtc);
                run.AdvanceClock(_clock.UtcNow);

                var resumeResult = await _executionEngine.ResumeExecutionAsync(execution.Id, nextTask.NodeKey, "{}", ct);
                nextTask.Complete();

                if (resumeResult.IsFailure)
                {
                    break;
                }
            }
        }

        if (execution.Status == ExecutionStatus.Completed)
        {
            run.Complete(_clock.UtcNow, execution.ContextJson);
        }

        await _db.SaveChangesAsync(ct);
        return Result<SimulationResultDto>.Success(BuildResultDto(run, execution));
    }

    public async Task<Result<SimulationResultDto>> AdvanceClockAsync(Guid simulationRunId, int? minutes, bool advanceToNextTask, CancellationToken ct = default)
    {
        var run = _db.SimulationRuns.FirstOrDefault(r => r.Id == simulationRunId);
        if (run == null) return Result<SimulationResultDto>.Failure("Simulation run not found.");

        var execution = _db.Executions.FirstOrDefault(e => e.SimulationRunId == run.Id);
        if (execution == null) return Result<SimulationResultDto>.Failure("Execution associated with simulation run not found.");

        if (advanceToNextTask && execution.Status == ExecutionStatus.Waiting)
        {
            var nextTask = _db.ScheduledTasks
                .Where(t => t.ExecutionId == execution.Id && t.Status == DomainTaskStatus.Pending)
                .OrderBy(t => t.DueAtUtc)
                .FirstOrDefault();

            if (nextTask != null)
            {
                _clock.SetTime(nextTask.DueAtUtc);
                run.AdvanceClock(_clock.UtcNow);

                await _executionEngine.ResumeExecutionAsync(execution.Id, nextTask.NodeKey, "{}", ct);
                nextTask.Complete();
            }
            else if (minutes.HasValue && minutes.Value > 0)
            {
                _clock.AdvanceBy(TimeSpan.FromMinutes(minutes.Value));
                run.AdvanceClock(_clock.UtcNow);
            }
        }
        else if (minutes.HasValue && minutes.Value > 0)
        {
            _clock.AdvanceBy(TimeSpan.FromMinutes(minutes.Value));
            run.AdvanceClock(_clock.UtcNow);

            // Check if any scheduled task is now due
            var dueTasks = _db.ScheduledTasks
                .Where(t => t.ExecutionId == execution.Id && t.Status == DomainTaskStatus.Pending && t.DueAtUtc <= _clock.UtcNow)
                .OrderBy(t => t.DueAtUtc)
                .ToList();

            foreach (var task in dueTasks)
            {
                await _executionEngine.ResumeExecutionAsync(execution.Id, task.NodeKey, "{}", ct);
                task.Complete();
            }
        }

        if (execution.Status == ExecutionStatus.Completed)
        {
            run.Complete(_clock.UtcNow, execution.ContextJson);
        }

        await _db.SaveChangesAsync(ct);
        return Result<SimulationResultDto>.Success(BuildResultDto(run, execution));
    }

    public Task<Result<SimulationResultDto>> GetSimulationResultAsync(Guid simulationRunId, CancellationToken ct = default)
    {
        var run = _db.SimulationRuns.FirstOrDefault(r => r.Id == simulationRunId);
        if (run == null) return Task.FromResult(Result<SimulationResultDto>.Failure("Simulation run not found."));

        var execution = _db.Executions.FirstOrDefault(e => e.SimulationRunId == run.Id);
        if (execution == null) return Task.FromResult(Result<SimulationResultDto>.Failure("Execution not found."));

        return Task.FromResult(Result<SimulationResultDto>.Success(BuildResultDto(run, execution)));
    }

    private SimulationResultDto BuildResultDto(SimulationRun run, Execution execution)
    {
        var steps = _db.ExecutionSteps
            .Where(s => s.ExecutionId == execution.Id)
            .OrderBy(s => s.ExecutedAtUtc)
            .Select(s => new ExecutionStepDto
            {
                Id = s.Id,
                NodeKey = s.NodeKey,
                Attempt = s.Attempt,
                InputJson = s.InputJson,
                OutputJson = s.OutputJson,
                StateDiffJson = s.StateDiffJson,
                Status = s.Status.ToString(),
                ErrorMessage = s.ErrorMessage,
                DurationMs = s.DurationMs,
                ExecutedAtUtc = s.ExecutedAtUtc
            })
            .ToList();

        var resumptions = _db.ScheduledTasks
            .Where(t => t.ExecutionId == execution.Id)
            .OrderBy(t => t.DueAtUtc)
            .Select(t => new SimulationResumptionDto
            {
                TaskId = t.Id,
                NodeKey = t.NodeKey,
                DueAtUtc = t.DueAtUtc,
                Status = t.Status.ToString()
            })
            .ToList();

        var stepIds = steps.Select(s => s.Id).ToHashSet();
        var effects = _db.EffectIntents
            .Where(e => stepIds.Contains(e.ExecutionStepId))
            .OrderBy(e => e.CreatedAtUtc)
            .Select(e => new SimulationEffectDto
            {
                IntentId = e.Id,
                Type = e.Type,
                IdempotencyKey = e.IdempotencyKey,
                RequestJson = e.RequestJson,
                ResponseJson = e.FixtureResponseJson,
                Status = e.Status
            })
            .ToList();

        return new SimulationResultDto
        {
            SimulationRunId = run.Id,
            ExecutionId = execution.Id,
            WorkflowVersionId = run.WorkflowVersionId,
            Status = execution.Status.ToString(),
            Mode = run.Mode.ToString(),
            ClockStartUtc = run.ClockStartUtc,
            CurrentClockUtc = run.CurrentClockUtc,
            TotalSimulatedDuration = run.CurrentClockUtc - run.ClockStartUtc,
            FinalStateJson = execution.ContextJson,
            StepTraces = steps,
            ScheduledResumptions = resumptions,
            EmittedEffects = effects
        };
    }
}
