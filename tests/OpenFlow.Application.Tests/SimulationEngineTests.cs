using System.Text.Json;
using OpenFlow.Application.Executions.Services;
using OpenFlow.Application.SimulationRuns.Services;
using OpenFlow.Contracts.SimulationRuns;
using OpenFlow.Contracts.Workflows;
using OpenFlow.Domain.Workflows;
using OpenFlow.Infrastructure.Clock;
using OpenFlow.Infrastructure.Effects;
using OpenFlow.Infrastructure.Persistence;

namespace OpenFlow.Application.Tests;

public class SimulationEngineTests
{
    private static readonly DateTime StartTime = new(2026, 9, 28, 9, 0, 0, DateTimeKind.Utc);

    [Fact]
    public async Task FastSimulation_ShouldAutoAdvanceClockAcrossScheduledWaitAndComplete()
    {
        var db = new OpenFlowDbContext();
        var clock = new VirtualSimulationClock(StartTime);
        var fixtureRegistry = new FixtureRegistry();
        var effectDispatcher = new MockEffectDispatcher(fixtureRegistry);
        var executionEngine = new WorkflowExecutionEngine(db, clock, effectDispatcher);
        var simulationEngine = new SimulationEngine(db, clock, executionEngine, fixtureRegistry);

        // Workflow: Trigger -> SetScore (90) -> Wait 7 Days -> IfElse (Score >= 80) -> AddTag (qualified) -> End
        var graph = new WorkflowGraphDto
        {
            Nodes = new()
            {
                new WorkflowNodeDto { NodeKey = "trigger", Type = "Trigger" },
                new WorkflowNodeDto { NodeKey = "set_score", Type = "SetContactField", ConfigJson = "{\"field\":\"score\",\"value\":\"90\"}" },
                new WorkflowNodeDto { NodeKey = "wait_7d", Type = "WaitDuration", ConfigJson = "{\"amount\":7,\"unit\":\"days\"}" },
                new WorkflowNodeDto { NodeKey = "check_score", Type = "IfElse", ConfigJson = "{\"field\":\"contact.score\",\"operator\":\"greaterThanOrEqual\",\"value\":80}" },
                new WorkflowNodeDto { NodeKey = "add_tag", Type = "AddTag", ConfigJson = "{\"tag\":\"qualified\"}" },
                new WorkflowNodeDto { NodeKey = "end", Type = "End" }
            },
            Edges = new()
            {
                new WorkflowEdgeDto { SourceNodeKey = "trigger", TargetNodeKey = "set_score", SourcePort = "default" },
                new WorkflowEdgeDto { SourceNodeKey = "set_score", TargetNodeKey = "wait_7d", SourcePort = "default" },
                new WorkflowEdgeDto { SourceNodeKey = "wait_7d", TargetNodeKey = "check_score", SourcePort = "default" },
                new WorkflowEdgeDto { SourceNodeKey = "check_score", TargetNodeKey = "add_tag", SourcePort = "true" },
                new WorkflowEdgeDto { SourceNodeKey = "add_tag", TargetNodeKey = "end", SourcePort = "default" }
            }
        };

        var versionId = Guid.NewGuid();
        var version = new WorkflowVersion(versionId, Guid.NewGuid(), 1, JsonSerializer.Serialize(graph), clock.UtcNow);
        db.WorkflowVersions.Add(version);

        var request = new StartSimulationRequest
        {
            WorkflowVersionId = versionId,
            Mode = "FastSimulation",
            SubjectId = "contact_abc",
            InitialStateJson = "{\"contact\":{\"id\":\"contact_abc\",\"score\":0,\"tags\":[]}}"
        };

        var result = await simulationEngine.StartSimulationAsync(request);

        Assert.True(result.IsSuccess);
        var sim = result.Value!;
        Assert.Equal("Completed", sim.Status);
        Assert.Equal(TimeSpan.FromDays(7), sim.TotalSimulatedDuration);
        Assert.Equal(StartTime.AddDays(7), sim.CurrentClockUtc);

        // Verify state mutated and tag added
        Assert.Contains("qualified", sim.FinalStateJson);
        Assert.Contains("90", sim.FinalStateJson);

        // Verify all 6 nodes executed
        Assert.Equal(6, sim.StepTraces.Count);
        Assert.Contains(sim.StepTraces, s => s.NodeKey == "wait_7d" && s.Status == "Waiting");
        Assert.Contains(sim.StepTraces, s => s.NodeKey == "add_tag" && s.Status == "Completed");
    }

    [Fact]
    public async Task StepSimulation_ShouldPauseAtWaitAndResumeOnAdvanceClock()
    {
        var db = new OpenFlowDbContext();
        var clock = new VirtualSimulationClock(StartTime);
        var fixtureRegistry = new FixtureRegistry();
        var effectDispatcher = new MockEffectDispatcher(fixtureRegistry);
        var executionEngine = new WorkflowExecutionEngine(db, clock, effectDispatcher);
        var simulationEngine = new SimulationEngine(db, clock, executionEngine, fixtureRegistry);

        var graph = new WorkflowGraphDto
        {
            Nodes = new()
            {
                new WorkflowNodeDto { NodeKey = "trigger", Type = "Trigger" },
                new WorkflowNodeDto { NodeKey = "wait_step", Type = "WaitDuration", ConfigJson = "{\"amount\":2,\"unit\":\"hours\"}" },
                new WorkflowNodeDto { NodeKey = "end", Type = "End" }
            },
            Edges = new()
            {
                new WorkflowEdgeDto { SourceNodeKey = "trigger", TargetNodeKey = "wait_step", SourcePort = "default" },
                new WorkflowEdgeDto { SourceNodeKey = "wait_step", TargetNodeKey = "end", SourcePort = "default" }
            }
        };

        var versionId = Guid.NewGuid();
        var version = new WorkflowVersion(versionId, Guid.NewGuid(), 1, JsonSerializer.Serialize(graph), clock.UtcNow);
        db.WorkflowVersions.Add(version);

        var request = new StartSimulationRequest
        {
            WorkflowVersionId = versionId,
            Mode = "Step",
            InitialStateJson = "{}"
        };

        // 1. Starts and halts at wait_step
        var startResult = await simulationEngine.StartSimulationAsync(request);
        Assert.True(startResult.IsSuccess);
        var stepSim = startResult.Value!;
        Assert.Equal("Waiting", stepSim.Status);
        Assert.Single(stepSim.ScheduledResumptions);

        // 2. Advance clock to next due task
        var advanceResult = await simulationEngine.AdvanceClockAsync(stepSim.SimulationRunId, null, advanceToNextTask: true);
        Assert.True(advanceResult.IsSuccess);
        var completedSim = advanceResult.Value!;
        Assert.Equal("Completed", completedSim.Status);
        Assert.Equal(TimeSpan.FromHours(2), completedSim.TotalSimulatedDuration);
    }

    [Fact]
    public async Task DynamicIntegrationFixtures_ShouldInjectMatchedMockResponses()
    {
        var db = new OpenFlowDbContext();
        var clock = new VirtualSimulationClock(StartTime);
        var fixtureRegistry = new FixtureRegistry();
        var effectDispatcher = new MockEffectDispatcher(fixtureRegistry);
        var executionEngine = new WorkflowExecutionEngine(db, clock, effectDispatcher);
        var simulationEngine = new SimulationEngine(db, clock, executionEngine, fixtureRegistry);

        var graph = new WorkflowGraphDto
        {
            Nodes = new()
            {
                new WorkflowNodeDto { NodeKey = "trigger", Type = "Trigger" },
                new WorkflowNodeDto
                {
                    NodeKey = "call_webhook",
                    Type = "Webhook",
                    ConfigJson = "{\"url\":\"https://api.partner.com/v1/enroll\",\"method\":\"POST\"}"
                },
                new WorkflowNodeDto { NodeKey = "end", Type = "End" }
            },
            Edges = new()
            {
                new WorkflowEdgeDto { SourceNodeKey = "trigger", TargetNodeKey = "call_webhook", SourcePort = "default" },
                new WorkflowEdgeDto { SourceNodeKey = "call_webhook", TargetNodeKey = "end", SourcePort = "default" }
            }
        };

        var versionId = Guid.NewGuid();
        var version = new WorkflowVersion(versionId, Guid.NewGuid(), 1, JsonSerializer.Serialize(graph), clock.UtcNow);
        db.WorkflowVersions.Add(version);

        var customResponseBody = "{\"leadId\":\"lead_999\",\"status\":\"accepted\"}";
        var request = new StartSimulationRequest
        {
            WorkflowVersionId = versionId,
            Mode = "FastSimulation",
            Fixtures = new()
            {
                new SimulationFixtureDto
                {
                    Key = "api.partner.com",
                    Type = "Webhook",
                    StatusCode = 200,
                    ResponseBodyJson = customResponseBody
                }
            }
        };

        var result = await simulationEngine.StartSimulationAsync(request);

        Assert.True(result.IsSuccess);
        var sim = result.Value!;
        Assert.Equal("Completed", sim.Status);
        Assert.Single(sim.EmittedEffects);

        var effect = sim.EmittedEffects.First();
        Assert.Equal("Webhook", effect.Type);
        Assert.Equal(customResponseBody, effect.ResponseJson);
    }
}
