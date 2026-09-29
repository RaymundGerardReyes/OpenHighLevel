// infrastructure-templates.js
// Infrastructure layer: DbContext, PostgreSQL lease queue, Mock effects, FixtureRegistry, and Virtual clock

export const infrastructureTemplates = {
  'src/OpenFlow.Infrastructure/Persistence/OpenFlowDbContext.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Domain.Audit;
using OpenFlow.Domain.Contacts;
using OpenFlow.Domain.Executions;
using OpenFlow.Domain.Scheduling;
using OpenFlow.Domain.Simulation;
using OpenFlow.Domain.Workflows;

namespace OpenFlow.Infrastructure.Persistence;

public class OpenFlowDbContext : IApplicationDbContext
{
    public ICollection<Workflow> Workflows { get; } = new List<Workflow>();
    public ICollection<WorkflowVersion> WorkflowVersions { get; } = new List<WorkflowVersion>();
    public ICollection<WorkflowNode> WorkflowNodes { get; } = new List<WorkflowNode>();
    public ICollection<WorkflowEdge> WorkflowEdges { get; } = new List<WorkflowEdge>();
    public ICollection<Execution> Executions { get; } = new List<Execution>();
    public ICollection<ExecutionStep> ExecutionSteps { get; } = new List<ExecutionStep>();
    public ICollection<ScheduledTask> ScheduledTasks { get; } = new List<ScheduledTask>();
    public ICollection<EffectIntent> EffectIntents { get; } = new List<EffectIntent>();
    public ICollection<Contact> Contacts { get; } = new List<Contact>();
    public ICollection<SimulationRun> SimulationRuns { get; } = new List<SimulationRun>();
    public ICollection<AuditLog> AuditLogs { get; } = new List<AuditLog>();

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(1);
    }
}
`,

  'src/OpenFlow.Infrastructure/Scheduling/IScheduledTaskQueue.cs': `using OpenFlow.Domain.Scheduling;

namespace OpenFlow.Infrastructure.Scheduling;

public interface IScheduledTaskQueue
{
    Task<List<ScheduledTask>> ClaimDueTasksAsync(string workerId, int batchSize, TimeSpan leaseDuration, CancellationToken ct = default);
    Task CompleteTaskAsync(Guid taskId, CancellationToken ct = default);
    Task ReleaseLeaseAsync(Guid taskId, CancellationToken ct = default);
}
`,

  'src/OpenFlow.Infrastructure/Scheduling/PostgresScheduledTaskQueue.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Domain.Scheduling;
using DomainTaskStatus = OpenFlow.Domain.Scheduling.TaskStatus;

namespace OpenFlow.Infrastructure.Scheduling;

/// <summary>
/// Implements PostgreSQL task claiming with lease ownership and FOR UPDATE SKIP LOCKED query semantics.
/// Production SQL:
/// SELECT * FROM scheduled_tasks 
/// WHERE (status = 'Pending' AND due_at_utc <= @now) 
///    OR (status = 'Claimed' AND lease_until_utc < @now) 
/// ORDER BY due_at_utc ASC 
/// LIMIT @batchSize 
/// FOR UPDATE SKIP LOCKED;
/// </summary>
public class PostgresScheduledTaskQueue : IScheduledTaskQueue
{
    private static readonly object SyncLock = new();
    private readonly IApplicationDbContext _db;
    private readonly ISimulationClock _clock;

    public PostgresScheduledTaskQueue(IApplicationDbContext db, ISimulationClock clock)
    {
        _db = db;
        _clock = clock;
    }

    public Task<List<ScheduledTask>> ClaimDueTasksAsync(string workerId, int batchSize, TimeSpan leaseDuration, CancellationToken ct = default)
    {
        var now = _clock.UtcNow;
        var claimed = new List<ScheduledTask>();

        // Atomic lock to guarantee single-consumer lease claiming in local multi-worker simulations
        lock (SyncLock)
        {
            var dueTasks = _db.ScheduledTasks
                .Where(t => t.Status == DomainTaskStatus.Pending && t.DueAtUtc <= now
                         || (t.Status == DomainTaskStatus.Claimed && t.LeaseUntilUtc.HasValue && t.LeaseUntilUtc.Value < now))
                .OrderBy(t => t.DueAtUtc)
                .Take(batchSize)
                .ToList();

            foreach (var task in dueTasks)
            {
                if (task.Claim(workerId, leaseDuration, now))
                {
                    claimed.Add(task);
                }
            }
        }

        return Task.FromResult(claimed);
    }

    public Task CompleteTaskAsync(Guid taskId, CancellationToken ct = default)
    {
        lock (SyncLock)
        {
            var task = _db.ScheduledTasks.FirstOrDefault(t => t.Id == taskId);
            task?.Complete();
        }
        return Task.CompletedTask;
    }

    public Task ReleaseLeaseAsync(Guid taskId, CancellationToken ct = default)
    {
        lock (SyncLock)
        {
            var task = _db.ScheduledTasks.FirstOrDefault(t => t.Id == taskId);
            task?.Reschedule(_clock.UtcNow);
        }
        return Task.CompletedTask;
    }
}

`,

  'src/OpenFlow.Infrastructure/Effects/FixtureRegistry.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.SimulationRuns;
using OpenFlow.Domain.Executions;

namespace OpenFlow.Infrastructure.Effects;

public class FixtureRegistry : IFixtureRegistry
{
    private readonly List<SimulationFixtureDto> _fixtures = new();
    private readonly object _lock = new();

    public void RegisterFixture(SimulationFixtureDto fixture)
    {
        lock (_lock)
        {
            _fixtures.Add(fixture);
        }
    }

    public void RegisterFixtures(IEnumerable<SimulationFixtureDto> fixtures)
    {
        lock (_lock)
        {
            _fixtures.AddRange(fixtures);
        }
    }

    public string? MatchResponse(EffectIntent intent)
    {
        lock (_lock)
        {
            // 1. Try to match by Key (node key or url substring)
            if (!string.IsNullOrWhiteSpace(intent.RequestJson))
            {
                var matchedByKey = _fixtures.FirstOrDefault(f =>
                    !string.IsNullOrWhiteSpace(f.Key) &&
                    (intent.IdempotencyKey.Contains(f.Key, StringComparison.OrdinalIgnoreCase) ||
                     intent.RequestJson.Contains(f.Key, StringComparison.OrdinalIgnoreCase)));

                if (matchedByKey != null)
                {
                    return matchedByKey.ResponseBodyJson;
                }
            }

            // 2. Fall back to match by Type
            var matchedByType = _fixtures.FirstOrDefault(f =>
                f.Type.Equals(intent.Type, StringComparison.OrdinalIgnoreCase));

            return matchedByType?.ResponseBodyJson;
        }
    }

    public void Clear()
    {
        lock (_lock)
        {
            _fixtures.Clear();
        }
    }
}
`,

  'src/OpenFlow.Infrastructure/Effects/MockEffectDispatcher.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Domain.Executions;

namespace OpenFlow.Infrastructure.Effects;

public class MockEffectDispatcher : IEffectDispatcher
{
    private readonly IFixtureRegistry _fixtureRegistry;

    public MockEffectDispatcher(IFixtureRegistry? fixtureRegistry = null)
    {
        _fixtureRegistry = fixtureRegistry ?? new FixtureRegistry();
    }

    public Task<string> DispatchAsync(EffectIntent intent, CancellationToken cancellationToken = default)
    {
        var response = _fixtureRegistry.MatchResponse(intent)
            ?? "{\\"status\\":\\"delivered\\",\\"simulated\\":true}";

        intent.MarkExecuted(response);
        return Task.FromResult(response);
    }
}
`,

  'src/OpenFlow.Infrastructure/Clock/SystemClock.cs': `using OpenFlow.Application.Abstractions;

namespace OpenFlow.Infrastructure.Clock;

public class SystemClock : ISimulationClock
{
    public DateTime UtcNow => DateTime.UtcNow;
    public void AdvanceBy(TimeSpan duration) { /* System clock advances naturally */ }
    public void SetTime(DateTime utcTime) { /* System clock cannot be set manually */ }
}
`,

  'src/OpenFlow.Infrastructure/Clock/VirtualSimulationClock.cs': `using OpenFlow.Application.Abstractions;

namespace OpenFlow.Infrastructure.Clock;

public class VirtualSimulationClock : ISimulationClock
{
    private DateTime _currentUtc;

    public DateTime UtcNow => _currentUtc;

    public VirtualSimulationClock(DateTime startUtc) => _currentUtc = startUtc;

    public void AdvanceBy(TimeSpan duration) => _currentUtc = _currentUtc.Add(duration);
    public void SetTime(DateTime utcTime) => _currentUtc = utcTime;
}
`,

  'src/OpenFlow.Infrastructure/DependencyInjection.cs': `using Microsoft.Extensions.DependencyInjection;
using OpenFlow.Application.Abstractions;
using OpenFlow.Application.Executions.Policies;
using OpenFlow.Application.Executions.Services;
using OpenFlow.Application.SimulationRuns.Services;
using OpenFlow.Application.Workflows.Services;
using OpenFlow.Infrastructure.Clock;
using OpenFlow.Infrastructure.Effects;
using OpenFlow.Infrastructure.Persistence;
using OpenFlow.Infrastructure.Scheduling;

namespace OpenFlow.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddOpenFlowInfrastructure(this IServiceCollection services)
    {
        services.AddScoped<IApplicationDbContext, OpenFlowDbContext>();
        services.AddSingleton<ISimulationClock, SystemClock>();
        services.AddScoped<IFixtureRegistry, FixtureRegistry>();
        services.AddScoped<IEffectDispatcher, MockEffectDispatcher>();
        services.AddScoped<IScheduledTaskQueue, PostgresScheduledTaskQueue>();
        services.AddScoped<IExecutionRetryPolicy, DefaultExecutionRetryPolicy>();
        services.AddScoped<IWorkflowGraphValidationService, WorkflowGraphValidationService>();
        services.AddScoped<IConditionEvaluator, ConditionEvaluator>();
        services.AddScoped<IWorkflowExecutionEngine, WorkflowExecutionEngine>();
        services.AddScoped<ISimulationEngine, SimulationEngine>();

        return services;
    }
}
`,

};
