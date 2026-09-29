using System.Text.Json;
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

        var result = await engine.StartExecutionAsync(versionId, null, "contact_test", "{\"score\":85}");

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
                new WorkflowNodeDto { NodeKey = "set_score", Type = "SetContactField", ConfigJson = "{\"field\":\"score\",\"value\":\"95\"}" },
                new WorkflowNodeDto { NodeKey = "add_tag", Type = "AddTag", ConfigJson = "{\"tag\":\"vip\"}" },
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

        var initialContext = "{\"contact\":{\"id\":\"c1\",\"email\":\"test@example.com\",\"score\":50,\"tags\":[\"lead\"]}}";
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
                    ConfigJson = "{\"field\":\"contact.score\",\"operator\":\"greaterThanOrEqual\",\"value\":80}"
                },
                new WorkflowNodeDto { NodeKey = "qualified_path", Type = "AddTag", ConfigJson = "{\"tag\":\"qualified\"}" },
                new WorkflowNodeDto { NodeKey = "nurture_path", Type = "AddTag", ConfigJson = "{\"tag\":\"nurture\"}" },
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

        var highResult = await engine.StartExecutionAsync(versionId, null, "c1", "{\"contact\":{\"score\":85}}");
        Assert.True(highResult.IsSuccess);
        Assert.Contains(db.ExecutionSteps, s => s.NodeKey == "qualified_path");
        Assert.DoesNotContain(db.ExecutionSteps, s => s.NodeKey == "nurture_path");

        db.ExecutionSteps.Clear();

        var lowResult = await engine.StartExecutionAsync(versionId, null, "c2", "{\"contact\":{\"score\":40}}");
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
                new WorkflowNodeDto { NodeKey = "wait_step", Type = "WaitDuration", ConfigJson = "{\"amount\":15,\"unit\":\"minutes\"}" },
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
                new WorkflowNodeDto { NodeKey = "send_sms", Type = "SendMessage", ConfigJson = "{\"channel\":\"sms\",\"body\":\"Hello\"}" },
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
                    ConfigJson = "{\"condition\":{\"field\":\"contact.tags\",\"operator\":\"contains\",\"value\":\"booked\"},\"policy\":\"EndWorkflow\"}"
                },
                new WorkflowNodeDto { NodeKey = "after_goal", Type = "AddTag", ConfigJson = "{\"tag\":\"followed_up\"}" },
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

        var achievedResult = await engine.StartExecutionAsync(versionId, null, "c1", "{\"contact\":{\"tags\":[\"booked\"]}}");
        Assert.True(achievedResult.IsSuccess);
        Assert.Contains(db.ExecutionSteps, s => s.NodeKey == "after_goal");

        db.ExecutionSteps.Clear();

        var unachievedResult = await engine.StartExecutionAsync(versionId, null, "c2", "{\"contact\":{\"tags\":[]}}");
        Assert.True(unachievedResult.IsSuccess);
        Assert.DoesNotContain(db.ExecutionSteps, s => s.NodeKey == "after_goal");
        Assert.Contains(db.ExecutionSteps, s => s.NodeKey == "goal_step");
    }
}
