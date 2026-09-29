// test-templates.js
// Unit test suites, sample fixtures, and architecture documentation

export const testTemplates = {
  'tests/OpenFlow.Domain.Tests/WorkflowAggregateTests.cs': `using OpenFlow.Domain.Workflows;

namespace OpenFlow.Domain.Tests;

public class WorkflowAggregateTests
{
    [Fact]
    public void CreateWorkflow_ShouldInitializeAsDraft()
    {
        var id = Guid.NewGuid();
        var workflow = new Workflow(id, "Lead Qualification", "Test Workflow", DateTime.UtcNow);

        Assert.Equal(id, workflow.Id);
        Assert.Equal("Lead Qualification", workflow.Name);
        Assert.Equal(WorkflowStatus.Draft, workflow.Status);
        Assert.Null(workflow.PublishedVersionId);
        Assert.Equal(1, workflow.LatestVersionNumber);
    }

    [Fact]
    public void PublishVersion_ShouldSetStatusToPublishedAndRecordVersion()
    {
        var workflow = new Workflow(Guid.NewGuid(), "Onboarding Flow", "Description", DateTime.UtcNow);
        var versionId = Guid.NewGuid();

        workflow.PublishVersion(versionId, 2, DateTime.UtcNow);

        Assert.Equal(WorkflowStatus.Published, workflow.Status);
        Assert.Equal(versionId, workflow.PublishedVersionId);
        Assert.Equal(2, workflow.LatestVersionNumber);
    }

    [Fact]
    public void Archive_ShouldTransitionStatusToArchived()
    {
        var workflow = new Workflow(Guid.NewGuid(), "Obsolete Flow", "Description", DateTime.UtcNow);
        workflow.Archive(DateTime.UtcNow);

        Assert.Equal(WorkflowStatus.Archived, workflow.Status);
    }
}
`,

  'tests/OpenFlow.Domain.Tests/ExecutionAggregateTests.cs': `using OpenFlow.Domain.Executions;

namespace OpenFlow.Domain.Tests;

public class ExecutionAggregateTests
{
    [Fact]
    public void Execution_ShouldFollowLifecycleTransitions()
    {
        var execution = new Execution(Guid.NewGuid(), Guid.NewGuid(), null, "contact_123", "trigger_node", "{}", DateTime.UtcNow);
        Assert.Equal(ExecutionStatus.Pending, execution.Status);

        execution.Start();
        Assert.Equal(ExecutionStatus.Running, execution.Status);

        var waitState = new WaitState(DateTime.UtcNow.AddMinutes(5), "Timer", Guid.NewGuid());
        execution.SetWaiting(waitState);
        Assert.Equal(ExecutionStatus.Waiting, execution.Status);
        Assert.NotNull(execution.CurrentWaitState);

        execution.MoveToNode("action_node", "{\\"updated\\":true}");
        Assert.Equal(ExecutionStatus.Running, execution.Status);
        Assert.Null(execution.CurrentWaitState);

        execution.Complete(DateTime.UtcNow);
        Assert.Equal(ExecutionStatus.Completed, execution.Status);
        Assert.NotNull(execution.CompletedAtUtc);
    }
}
`,

  'tests/OpenFlow.Application.Tests/WorkflowExecutionEngineTests.cs': `using System.Text.Json;
using OpenFlow.Application.Executions.Services;
using OpenFlow.Contracts.Workflows;
using OpenFlow.Domain.Executions;
using OpenFlow.Domain.Workflows;
using OpenFlow.Infrastructure.Clock;
using OpenFlow.Infrastructure.Effects;
using OpenFlow.Infrastructure.Persistence;

namespace OpenFlow.Application.Tests;

public class WorkflowExecutionEngineTests
{
    private static readonly DateTime TestTime = new(2026, 9, 28, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public async Task StartExecutionAsync_SimpleWorkflow_ShouldCompleteAndEmitSteps()
    {
        var db = new OpenFlowDbContext();
        var clock = new VirtualSimulationClock(TestTime);
        var effectDispatcher = new MockEffectDispatcher();
        var engine = new WorkflowExecutionEngine(db, clock, effectDispatcher);

        var graph = new WorkflowGraphDto
        {
            Nodes = new()
            {
                new WorkflowNodeDto { NodeKey = "trigger_1", Type = "Trigger", Name = "Start" },
                new WorkflowNodeDto { NodeKey = "end_1", Type = "End", Name = "Finish" }
            },
            Edges = new()
            {
                new WorkflowEdgeDto { SourceNodeKey = "trigger_1", TargetNodeKey = "end_1", SourcePort = "default" }
            }
        };

        var versionId = Guid.NewGuid();
        var version = new WorkflowVersion(versionId, Guid.NewGuid(), 1, JsonSerializer.Serialize(graph), clock.UtcNow);
        db.WorkflowVersions.Add(version);

        var result = await engine.StartExecutionAsync(versionId, null, "contact_test", "{\\"score\\":85}");

        Assert.True(result.IsSuccess);
        var execution = result.Value!;
        Assert.Equal(ExecutionStatus.Completed, execution.Status);
        Assert.True(db.ExecutionSteps.Count >= 2);
    }

    [Fact]
    public async Task StartExecutionAsync_ContactMutationsAndTags_ShouldEmitStateDiff()
    {
        var db = new OpenFlowDbContext();
        var clock = new VirtualSimulationClock(TestTime);
        var effectDispatcher = new MockEffectDispatcher();
        var engine = new WorkflowExecutionEngine(db, clock, effectDispatcher);

        var graph = new WorkflowGraphDto
        {
            Nodes = new()
            {
                new WorkflowNodeDto { NodeKey = "trigger_1", Type = "Trigger", Name = "Start" },
                new WorkflowNodeDto { NodeKey = "set_score", Type = "SetContactField", ConfigJson = "{\\"field\\":\\"score\\",\\"value\\":\\"95\\"}" },
                new WorkflowNodeDto { NodeKey = "add_tag", Type = "AddTag", ConfigJson = "{\\"tag\\":\\"vip\\"}" },
                new WorkflowNodeDto { NodeKey = "end_1", Type = "End", Name = "Finish" }
            },
            Edges = new()
            {
                new WorkflowEdgeDto { SourceNodeKey = "trigger_1", TargetNodeKey = "set_score", SourcePort = "default" },
                new WorkflowEdgeDto { SourceNodeKey = "set_score", TargetNodeKey = "add_tag", SourcePort = "default" },
                new WorkflowEdgeDto { SourceNodeKey = "add_tag", TargetNodeKey = "end_1", SourcePort = "default" }
            }
        };

        var versionId = Guid.NewGuid();
        var version = new WorkflowVersion(versionId, Guid.NewGuid(), 1, JsonSerializer.Serialize(graph), clock.UtcNow);
        db.WorkflowVersions.Add(version);

        var initialContext = "{\\"contact\\":{\\"id\\":\\"c1\\",\\"email\\":\\"test@example.com\\",\\"score\\":50,\\"tags\\":[\\"lead\\"]}}";
        var result = await engine.StartExecutionAsync(versionId, null, "c1", initialContext);

        Assert.True(result.IsSuccess);
        var execution = result.Value!;
        Assert.Equal(ExecutionStatus.Completed, execution.Status);

        var scoreStep = db.ExecutionSteps.First(s => s.NodeKey == "set_score");
        var scoreDiff = JsonSerializer.Deserialize<StateDiff>(scoreStep.StateDiffJson);
        Assert.NotNull(scoreDiff);
        Assert.True(scoreDiff.ModifiedFields.ContainsKey("Score"));
        Assert.Equal(95.0, ((JsonElement)scoreDiff.ModifiedFields["Score"].NewValue!).GetDouble());

        var tagStep = db.ExecutionSteps.First(s => s.NodeKey == "add_tag");
        var tagDiff = JsonSerializer.Deserialize<StateDiff>(tagStep.StateDiffJson);
        Assert.NotNull(tagDiff);
        Assert.Contains("vip", tagDiff.AddedTags);
    }

    [Fact]
    public async Task StartExecutionAsync_IfElseBranching_ShouldFollowConditionEvaluation()
    {
        var db = new OpenFlowDbContext();
        var clock = new VirtualSimulationClock(TestTime);
        var effectDispatcher = new MockEffectDispatcher();
        var engine = new WorkflowExecutionEngine(db, clock, effectDispatcher);

        var graph = new WorkflowGraphDto
        {
            Nodes = new()
            {
                new WorkflowNodeDto { NodeKey = "trigger_1", Type = "Trigger" },
                new WorkflowNodeDto
                {
                    NodeKey = "check_score",
                    Type = "IfElse",
                    ConfigJson = "{\\"field\\":\\"contact.score\\",\\"operator\\":\\"greaterThanOrEqual\\",\\"value\\":80}"
                },
                new WorkflowNodeDto { NodeKey = "qualified_path", Type = "AddTag", ConfigJson = "{\\"tag\\":\\"qualified\\"}" },
                new WorkflowNodeDto { NodeKey = "nurture_path", Type = "AddTag", ConfigJson = "{\\"tag\\":\\"nurture\\"}" },
                new WorkflowNodeDto { NodeKey = "end_1", Type = "End" }
            },
            Edges = new()
            {
                new WorkflowEdgeDto { SourceNodeKey = "trigger_1", TargetNodeKey = "check_score", SourcePort = "default" },
                new WorkflowEdgeDto { SourceNodeKey = "check_score", TargetNodeKey = "qualified_path", SourcePort = "true" },
                new WorkflowEdgeDto { SourceNodeKey = "check_score", TargetNodeKey = "nurture_path", SourcePort = "false" },
                new WorkflowEdgeDto { SourceNodeKey = "qualified_path", TargetNodeKey = "end_1", SourcePort = "default" },
                new WorkflowEdgeDto { SourceNodeKey = "nurture_path", TargetNodeKey = "end_1", SourcePort = "default" }
            }
        };

        var versionId = Guid.NewGuid();
        var version = new WorkflowVersion(versionId, Guid.NewGuid(), 1, JsonSerializer.Serialize(graph), clock.UtcNow);
        db.WorkflowVersions.Add(version);

        var highResult = await engine.StartExecutionAsync(versionId, null, "c1", "{\\"contact\\":{\\"score\\":85}}");
        Assert.True(highResult.IsSuccess);
        Assert.Contains(db.ExecutionSteps, s => s.NodeKey == "qualified_path");
        Assert.DoesNotContain(db.ExecutionSteps, s => s.NodeKey == "nurture_path");

        db.ExecutionSteps.Clear();

        var lowResult = await engine.StartExecutionAsync(versionId, null, "c2", "{\\"contact\\":{\\"score\\":40}}");
        Assert.True(lowResult.IsSuccess);
        Assert.Contains(db.ExecutionSteps, s => s.NodeKey == "nurture_path");
        Assert.DoesNotContain(db.ExecutionSteps, s => s.NodeKey == "qualified_path");
    }

    [Fact]
    public async Task StartExecutionAsync_WaitDurationAndResumption_ShouldHonorVirtualTime()
    {
        var db = new OpenFlowDbContext();
        var clock = new VirtualSimulationClock(TestTime);
        var effectDispatcher = new MockEffectDispatcher();
        var engine = new WorkflowExecutionEngine(db, clock, effectDispatcher);

        var graph = new WorkflowGraphDto
        {
            Nodes = new()
            {
                new WorkflowNodeDto { NodeKey = "trigger_1", Type = "Trigger" },
                new WorkflowNodeDto { NodeKey = "wait_step", Type = "WaitDuration", ConfigJson = "{\\"amount\\":15,\\"unit\\":\\"minutes\\"}" },
                new WorkflowNodeDto { NodeKey = "end_1", Type = "End" }
            },
            Edges = new()
            {
                new WorkflowEdgeDto { SourceNodeKey = "trigger_1", TargetNodeKey = "wait_step", SourcePort = "default" },
                new WorkflowEdgeDto { SourceNodeKey = "wait_step", TargetNodeKey = "end_1", SourcePort = "default" }
            }
        };

        var versionId = Guid.NewGuid();
        var version = new WorkflowVersion(versionId, Guid.NewGuid(), 1, JsonSerializer.Serialize(graph), clock.UtcNow);
        db.WorkflowVersions.Add(version);

        var result = await engine.StartExecutionAsync(versionId, null, "contact_test", "{}");

        Assert.True(result.IsSuccess);
        var execution = result.Value!;
        Assert.Equal(ExecutionStatus.Waiting, execution.Status);
        Assert.Single(db.ScheduledTasks);

        var scheduledTask = db.ScheduledTasks.First();
        Assert.Equal(TestTime.AddMinutes(15), scheduledTask.DueAtUtc);

        clock.AdvanceBy(TimeSpan.FromMinutes(15));
        var resumeResult = await engine.ResumeExecutionAsync(execution.Id, "wait_step", "{}");

        Assert.True(resumeResult.IsSuccess);
        Assert.Equal(ExecutionStatus.Completed, execution.Status);
    }

    [Fact]
    public async Task StartExecutionAsync_SideEffectTraceFirst_ShouldCreateIntentAndPersistSteps()
    {
        var db = new OpenFlowDbContext();
        var clock = new VirtualSimulationClock(TestTime);
        var effectDispatcher = new MockEffectDispatcher();
        var engine = new WorkflowExecutionEngine(db, clock, effectDispatcher);

        var graph = new WorkflowGraphDto
        {
            Nodes = new()
            {
                new WorkflowNodeDto { NodeKey = "trigger_1", Type = "Trigger" },
                new WorkflowNodeDto { NodeKey = "send_sms", Type = "SendMessage", ConfigJson = "{\\"channel\\":\\"sms\\",\\"body\\":\\"Hello\\"}" },
                new WorkflowNodeDto { NodeKey = "end_1", Type = "End" }
            },
            Edges = new()
            {
                new WorkflowEdgeDto { SourceNodeKey = "trigger_1", TargetNodeKey = "send_sms", SourcePort = "default" },
                new WorkflowEdgeDto { SourceNodeKey = "send_sms", TargetNodeKey = "end_1", SourcePort = "default" }
            }
        };

        var versionId = Guid.NewGuid();
        var version = new WorkflowVersion(versionId, Guid.NewGuid(), 1, JsonSerializer.Serialize(graph), clock.UtcNow);
        db.WorkflowVersions.Add(version);

        var result = await engine.StartExecutionAsync(versionId, null, "c1", "{}");

        Assert.True(result.IsSuccess);
        Assert.Single(db.EffectIntents);
        var intent = db.EffectIntents.First();
        Assert.Equal("SendMessage", intent.Type);

        var step = db.ExecutionSteps.First(s => s.NodeKey == "send_sms");
        Assert.Equal(ExecutionStatus.Completed, step.Status);
    }

    [Fact]
    public async Task StartExecutionAsync_GoalNode_AchievedVsPolicyHandling()
    {
        var db = new OpenFlowDbContext();
        var clock = new VirtualSimulationClock(TestTime);
        var effectDispatcher = new MockEffectDispatcher();
        var engine = new WorkflowExecutionEngine(db, clock, effectDispatcher);

        var graph = new WorkflowGraphDto
        {
            Nodes = new()
            {
                new WorkflowNodeDto { NodeKey = "trigger_1", Type = "Trigger" },
                new WorkflowNodeDto
                {
                    NodeKey = "goal_step",
                    Type = "Goal",
                    ConfigJson = "{\\"condition\\":{\\"field\\":\\"contact.tags\\",\\"operator\\":\\"contains\\",\\"value\\":\\"booked\\"},\\"policy\\":\\"EndWorkflow\\"}"
                },
                new WorkflowNodeDto { NodeKey = "after_goal", Type = "AddTag", ConfigJson = "{\\"tag\\":\\"followed_up\\"}" },
                new WorkflowNodeDto { NodeKey = "end_1", Type = "End" }
            },
            Edges = new()
            {
                new WorkflowEdgeDto { SourceNodeKey = "trigger_1", TargetNodeKey = "goal_step", SourcePort = "default" },
                new WorkflowEdgeDto { SourceNodeKey = "goal_step", TargetNodeKey = "after_goal", SourcePort = "default" },
                new WorkflowEdgeDto { SourceNodeKey = "after_goal", TargetNodeKey = "end_1", SourcePort = "default" }
            }
        };

        var versionId = Guid.NewGuid();
        var version = new WorkflowVersion(versionId, Guid.NewGuid(), 1, JsonSerializer.Serialize(graph), clock.UtcNow);
        db.WorkflowVersions.Add(version);

        var achievedResult = await engine.StartExecutionAsync(versionId, null, "c1", "{\\"contact\\":{\\"tags\\":[\\"booked\\"]}}");
        Assert.True(achievedResult.IsSuccess);
        Assert.Contains(db.ExecutionSteps, s => s.NodeKey == "after_goal");

        db.ExecutionSteps.Clear();

        var unachievedResult = await engine.StartExecutionAsync(versionId, null, "c2", "{\\"contact\\":{\\"tags\\":[]}}");
        Assert.True(unachievedResult.IsSuccess);
        Assert.DoesNotContain(db.ExecutionSteps, s => s.NodeKey == "after_goal");
        Assert.Contains(db.ExecutionSteps, s => s.NodeKey == "goal_step");
    }
}
`,

  'tests/OpenFlow.Application.Tests/SimulationEngineTests.cs': `using System.Text.Json;
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
                new WorkflowNodeDto { NodeKey = "set_score", Type = "SetContactField", ConfigJson = "{\\"field\\":\\"score\\",\\"value\\":\\"90\\"}" },
                new WorkflowNodeDto { NodeKey = "wait_7d", Type = "WaitDuration", ConfigJson = "{\\"amount\\":7,\\"unit\\":\\"days\\"}" },
                new WorkflowNodeDto { NodeKey = "check_score", Type = "IfElse", ConfigJson = "{\\"field\\":\\"contact.score\\",\\"operator\\":\\"greaterThanOrEqual\\",\\"value\\":80}" },
                new WorkflowNodeDto { NodeKey = "add_tag", Type = "AddTag", ConfigJson = "{\\"tag\\":\\"qualified\\"}" },
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
            InitialStateJson = "{\\"contact\\":{\\"id\\":\\"contact_abc\\",\\"score\\":0,\\"tags\\":[]}}"
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
                new WorkflowNodeDto { NodeKey = "wait_step", Type = "WaitDuration", ConfigJson = "{\\"amount\\":2,\\"unit\\":\\"hours\\"}" },
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
                    ConfigJson = "{\\"url\\":\\"https://api.partner.com/v1/enroll\\",\\"method\\":\\"POST\\"}"
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

        var customResponseBody = "{\\"leadId\\":\\"lead_999\\",\\"status\\":\\"accepted\\"}";
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
`,

  'tests/fixtures/workflows/lead-score-qualified-v1.json': `{
  "caseId": "lead-score-qualified-v1",
  "description": "Lead score qualification flow with conditional branch and wait",
  "clock": "2026-09-28T09:00:00+08:00",
  "contact": {
    "id": "c1",
    "email": "lead@example.com",
    "score": 80,
    "tags": []
  },
  "event": {
    "type": "ContactScoreUpdated",
    "score": 80
  },
  "workflow": {
    "nodes": [
      {
        "nodeKey": "trigger",
        "type": "Trigger",
        "name": "Score Updated"
      },
      {
        "nodeKey": "score-check",
        "type": "IfElse",
        "name": "Score >= 50"
      },
      {
        "nodeKey": "add-qualified",
        "type": "SetContactField",
        "name": "Mark Qualified"
      },
      {
        "nodeKey": "wait-followup",
        "type": "WaitDuration",
        "name": "Wait 24h"
      },
      {
        "nodeKey": "send-intro",
        "type": "SendMessage",
        "name": "Send Intro"
      },
      {
        "nodeKey": "end",
        "type": "End",
        "name": "Done"
      }
    ],
    "edges": [
      {
        "sourceNodeKey": "trigger",
        "targetNodeKey": "score-check",
        "sourcePort": "default"
      },
      {
        "sourceNodeKey": "score-check",
        "targetNodeKey": "add-qualified",
        "sourcePort": "true"
      },
      {
        "sourceNodeKey": "score-check",
        "targetNodeKey": "end",
        "sourcePort": "false"
      },
      {
        "sourceNodeKey": "add-qualified",
        "targetNodeKey": "wait-followup",
        "sourcePort": "default"
      },
      {
        "sourceNodeKey": "wait-followup",
        "targetNodeKey": "send-intro",
        "sourcePort": "default"
      },
      {
        "sourceNodeKey": "send-intro",
        "targetNodeKey": "end",
        "sourcePort": "default"
      }
    ]
  },
  "expected": {
    "path": [
      "trigger",
      "score-check",
      "add-qualified",
      "wait-followup"
    ],
    "statusAfterInitialStep": "Waiting",
    "scheduledWaitDurationMinutes": 1440
  }
}`,

  'docs/architecture/overview.md': `# OpenFlow Architecture Overview

## Core System Architecture
OpenFlow is engineered as a **Modular Monolith** with:
1. **Frontend**: Next.js 15+ App Router in \`apps/web\`.
2. **REST API Host**: ASP.NET Core 10 Web API in \`apps/api\`.
3. **Background Worker Host**: ASP.NET Core 10 Worker in \`apps/worker\`.
4. **Application Core**: Shared class libraries in \`src/\`:
   - \`OpenFlow.Domain\`: Invariant rules, aggregates, entities, value objects.
   - \`OpenFlow.Contracts\`: Transport schemas, DTOs, requests, and responses.
   - \`OpenFlow.Application\`: Feature use cases, CQRS commands/queries, validators, and execution engine.
   - \`OpenFlow.Infrastructure\`: Persistence, PostgreSQL scheduling queue, and effect dispatchers.

## Execution Flow & Resumption
\`\`\`text
API / Event -> StartExecutionHandler -> WorkflowExecutionEngine -> ExecutionStep (trace)
                                                                 |-> WaitNode (ScheduledTask)
                                                                       |
Worker Host (TaskPollingService) -> Postgres SKIP LOCKED claim --------+
                                 -> ResumeExecutionHandler
                                 -> WorkflowExecutionEngine -> Next Steps -> Completed
\`\`\`
`,

  'docs/adr/0001-modular-monolith-and-trace-first-engine.md': `# ADR 0001: Modular Monolith and Trace-First Execution Engine

## Context
OpenFlow requires high determinism, granular execution visibility, and rapid local iteration without the operational overhead of microservices or external orchestration engines.

## Decision
1. Adopt a modular monolith architecture with dual runtime hosts (API and Worker) sharing a clean domain and application core.
2. Require every execution transition to record an immutable \`ExecutionStep\` with before/after state diffs, input/output snapshots, and timing.
3. Decouple React Flow presentation objects from the semantic workflow graph domain model.
4. Utilize PostgreSQL with \`SKIP LOCKED\` row claiming and leases for durable asynchronous wait resumption.

## Status
Accepted.
`,

  'docs/onboarding/local-setup.md': `# Local Developer Setup Guide

## Prerequisites
- .NET 10 SDK (\`10.0.301\`+)
- Node.js (\`v22\`+)
- pnpm (\`10\`+)
- Docker & Docker Compose (for PostgreSQL 18)

## Quick Start
1. Run scaffolding:
   \`\`\`bash
   bash scripts/scaffold-openflow.sh
   # On Windows:
   ./scripts/scaffold-openflow.ps1
   \`\`\`
2. Spin up database:
   \`\`\`bash
   docker compose up -d
   \`\`\`
3. Run test suite:
   \`\`\`bash
   dotnet test OpenFlow.sln
   \`\`\`
4. Launch backend API:
   \`\`\`bash
   dotnet run --project apps/api
   \`\`\`
5. Launch background worker:
   \`\`\`bash
   dotnet run --project apps/worker
   \`\`\`
6. Launch web UI:
   \`\`\`bash
   pnpm install
   pnpm dev
   \`\`\`
`,

};
