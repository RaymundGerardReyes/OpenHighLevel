using System.Diagnostics;
using System.Text.Json;
using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Workflows;
using OpenFlow.Domain.Common;
using OpenFlow.Domain.Executions;
using OpenFlow.Domain.Scheduling;
using OpenFlow.Domain.Workflows;

namespace OpenFlow.Application.Executions.Services;

public class WorkflowExecutionEngine : IWorkflowExecutionEngine
{
    private readonly IApplicationDbContext _db;
    private readonly ISimulationClock _clock;
    private readonly IEffectDispatcher _effectDispatcher;
    private readonly IConditionEvaluator _conditionEvaluator;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = false
    };

    public WorkflowExecutionEngine(
        IApplicationDbContext db,
        ISimulationClock clock,
        IEffectDispatcher effectDispatcher,
        IConditionEvaluator? conditionEvaluator = null)
    {
        _db = db;
        _clock = clock;
        _effectDispatcher = effectDispatcher;
        _conditionEvaluator = conditionEvaluator ?? new ConditionEvaluator();
    }

    public async Task<Result<Execution>> StartExecutionAsync(
        Guid versionId,
        Guid? simulationRunId,
        string? subjectId,
        string initialContextJson,
        CancellationToken ct = default)
    {
        var version = _db.WorkflowVersions.FirstOrDefault(v => v.Id == versionId);
        if (version == null) return Result<Execution>.Failure("Workflow version not found.");

        var graph = JsonSerializer.Deserialize<WorkflowGraphDto>(version.DefinitionJson, JsonOptions) ?? new();
        var triggerNode = graph.Nodes.FirstOrDefault(n => n.Type.Equals("Trigger", StringComparison.OrdinalIgnoreCase))
            ?? graph.Nodes.FirstOrDefault();

        if (triggerNode == null) return Result<Execution>.Failure("Workflow graph has no nodes.");

        var state = ParseInitialState(initialContextJson, subjectId);
        string contextJson = JsonSerializer.Serialize(state, JsonOptions);

        var execution = new Execution(Guid.NewGuid(), versionId, simulationRunId, subjectId, triggerNode.NodeKey, contextJson, _clock.UtcNow);
        execution.Start();
        _db.Executions.Add(execution);

        await RunLoopAsync(execution, graph, state, ct);
        await _db.SaveChangesAsync(ct);

        return Result<Execution>.Success(execution);
    }

    public async Task<Result> ResumeExecutionAsync(
        Guid executionId,
        string nodeKey,
        string contextJson,
        CancellationToken ct = default)
    {
        var execution = _db.Executions.FirstOrDefault(e => e.Id == executionId);
        if (execution == null) return Result.Failure("Execution not found.");
        if (execution.Status != ExecutionStatus.Waiting && execution.Status != ExecutionStatus.Running)
            return Result.Failure($"Cannot resume execution with status {execution.Status}.");

        var version = _db.WorkflowVersions.FirstOrDefault(v => v.Id == execution.WorkflowVersionId);
        if (version == null) return Result.Failure("Workflow version not found.");

        var graph = JsonSerializer.Deserialize<WorkflowGraphDto>(version.DefinitionJson, JsonOptions) ?? new();

        var state = ParseInitialState(execution.ContextJson, execution.SubjectId);
        if (!string.IsNullOrWhiteSpace(contextJson) && contextJson.Trim() != "{}")
        {
            MergeContext(state, contextJson);
        }

        string targetNodeKey = nodeKey;
        var matchingNode = graph.Nodes.FirstOrDefault(n => n.NodeKey == nodeKey);
        if (matchingNode != null && matchingNode.Type.Equals("WaitDuration", StringComparison.OrdinalIgnoreCase))
        {
            var nextEdge = graph.Edges.FirstOrDefault(e => e.SourceNodeKey == matchingNode.NodeKey);
            if (nextEdge != null)
            {
                targetNodeKey = nextEdge.TargetNodeKey;
            }
        }

        execution.MoveToNode(targetNodeKey, JsonSerializer.Serialize(state, JsonOptions));

        await RunLoopAsync(execution, graph, state, ct);
        await _db.SaveChangesAsync(ct);

        return Result.Success();
    }

    private async Task RunLoopAsync(Execution execution, WorkflowGraphDto graph, ExecutionState state, CancellationToken ct)
    {
        const int maxSteps = 100;
        int stepCount = 0;

        while (execution.Status == ExecutionStatus.Running && stepCount < maxSteps)
        {
            stepCount++;
            var node = graph.Nodes.FirstOrDefault(n => n.NodeKey == execution.CurrentNodeKey);
            if (node == null)
            {
                execution.Complete(_clock.UtcNow);
                break;
            }

            var sw = Stopwatch.StartNew();
            var stepId = Guid.NewGuid();
            string selectedPort = NodePort.Default;
            var stateBefore = state.Clone();
            string inputJson = JsonSerializer.Serialize(state, JsonOptions);

            if (node.Type.Equals("SendMessage", StringComparison.OrdinalIgnoreCase) ||
                node.Type.Equals("Webhook", StringComparison.OrdinalIgnoreCase))
            {
                var step = ExecutionStep.Start(stepId, execution.Id, node.NodeKey, 1, inputJson, _clock.UtcNow);
                _db.ExecutionSteps.Add(step);
                await _db.SaveChangesAsync(ct);

                var intent = new EffectIntent(Guid.NewGuid(), stepId, $"{execution.Id}:{node.NodeKey}:1", node.Type, node.ConfigJson, _clock.UtcNow);
                _db.EffectIntents.Add(intent);

                string outputJson;
                try
                {
                    outputJson = await _effectDispatcher.DispatchAsync(intent, ct);
                    sw.Stop();
                    step.Complete(outputJson, "{}", sw.ElapsedMilliseconds);
                }
                catch (Exception ex)
                {
                    sw.Stop();
                    step.Fail(ex.Message, sw.ElapsedMilliseconds);
                    execution.Fail(_clock.UtcNow);
                    await _db.SaveChangesAsync(ct);
                    break;
                }

                await _db.SaveChangesAsync(ct);
            }
            else if (node.Type.Equals("Trigger", StringComparison.OrdinalIgnoreCase))
            {
                sw.Stop();
                var diff = ExecutionState.CalculateDiff(stateBefore, state);
                var diffJson = JsonSerializer.Serialize(diff, JsonOptions);
                var step = new ExecutionStep(stepId, execution.Id, node.NodeKey, 1, inputJson, "{\"triggered\":true}", diffJson, ExecutionStatus.Completed, _clock.UtcNow, sw.ElapsedMilliseconds);
                _db.ExecutionSteps.Add(step);
            }
            else if (node.Type.Equals("SetContactField", StringComparison.OrdinalIgnoreCase))
            {
                ApplySetContactField(node.ConfigJson, state);
                sw.Stop();
                var diff = ExecutionState.CalculateDiff(stateBefore, state);
                var diffJson = JsonSerializer.Serialize(diff, JsonOptions);
                var step = new ExecutionStep(stepId, execution.Id, node.NodeKey, 1, inputJson, "{\"mutated\":true}", diffJson, ExecutionStatus.Completed, _clock.UtcNow, sw.ElapsedMilliseconds);
                _db.ExecutionSteps.Add(step);
            }
            else if (node.Type.Equals("AddTag", StringComparison.OrdinalIgnoreCase))
            {
                var added = ApplyAddTag(node.ConfigJson, state);
                sw.Stop();
                var diff = ExecutionState.CalculateDiff(stateBefore, state);
                var diffJson = JsonSerializer.Serialize(diff, JsonOptions);
                var step = new ExecutionStep(stepId, execution.Id, node.NodeKey, 1, inputJson, JsonSerializer.Serialize(new { addedTags = added }, JsonOptions), diffJson, ExecutionStatus.Completed, _clock.UtcNow, sw.ElapsedMilliseconds);
                _db.ExecutionSteps.Add(step);
            }
            else if (node.Type.Equals("RemoveTag", StringComparison.OrdinalIgnoreCase))
            {
                var removed = ApplyRemoveTag(node.ConfigJson, state);
                sw.Stop();
                var diff = ExecutionState.CalculateDiff(stateBefore, state);
                var diffJson = JsonSerializer.Serialize(diff, JsonOptions);
                var step = new ExecutionStep(stepId, execution.Id, node.NodeKey, 1, inputJson, JsonSerializer.Serialize(new { removedTags = removed }, JsonOptions), diffJson, ExecutionStatus.Completed, _clock.UtcNow, sw.ElapsedMilliseconds);
                _db.ExecutionSteps.Add(step);
            }
            else if (node.Type.Equals("IfElse", StringComparison.OrdinalIgnoreCase))
            {
                var evalResult = _conditionEvaluator.Evaluate(node.ConfigJson, state);
                selectedPort = evalResult.IsMatched ? NodePort.True : NodePort.False;
                sw.Stop();
                var outputPayload = new
                {
                    branch = selectedPort,
                    matched = evalResult.IsMatched,
                    evaluatedRules = evalResult.EvaluatedRules
                };
                var step = new ExecutionStep(stepId, execution.Id, node.NodeKey, 1, inputJson, JsonSerializer.Serialize(outputPayload, JsonOptions), "{}", ExecutionStatus.Completed, _clock.UtcNow, sw.ElapsedMilliseconds);
                _db.ExecutionSteps.Add(step);
            }
            else if (node.Type.Equals("WaitDuration", StringComparison.OrdinalIgnoreCase))
            {
                var duration = ParseWaitDuration(node.ConfigJson);
                var dueAt = _clock.UtcNow.Add(duration);
                var scheduledTask = new ScheduledTask(Guid.NewGuid(), execution.Id, node.NodeKey, dueAt, _clock.UtcNow);
                _db.ScheduledTasks.Add(scheduledTask);

                execution.SetWaiting(new WaitState(dueAt, $"Wait {duration}", scheduledTask.Id));
                sw.Stop();

                var waitStep = new ExecutionStep(stepId, execution.Id, node.NodeKey, 1, inputJson, JsonSerializer.Serialize(new { waiting = true, dueAtUtc = dueAt, duration = duration.ToString() }, JsonOptions), "{}", ExecutionStatus.Waiting, _clock.UtcNow, sw.ElapsedMilliseconds);
                _db.ExecutionSteps.Add(waitStep);

                execution.UpdateContext(JsonSerializer.Serialize(state, JsonOptions));
                break;
            }
            else if (node.Type.Equals("Goal", StringComparison.OrdinalIgnoreCase))
            {
                var (achieved, policy, evalResult) = EvaluateGoal(node.ConfigJson, state);
                sw.Stop();
                var goalOutput = new
                {
                    goalAchieved = achieved,
                    policyApplied = policy,
                    evaluatedRules = evalResult.EvaluatedRules
                };
                var step = new ExecutionStep(stepId, execution.Id, node.NodeKey, 1, inputJson, JsonSerializer.Serialize(goalOutput, JsonOptions), "{}", ExecutionStatus.Completed, _clock.UtcNow, sw.ElapsedMilliseconds);
                _db.ExecutionSteps.Add(step);

                if (!achieved)
                {
                    if (policy.Equals("EndWorkflow", StringComparison.OrdinalIgnoreCase))
                    {
                        execution.Complete(_clock.UtcNow);
                        break;
                    }
                    else if (policy.Equals("WaitUntilMet", StringComparison.OrdinalIgnoreCase))
                    {
                        var recheckTime = _clock.UtcNow.AddMinutes(30);
                        var scheduledTask = new ScheduledTask(Guid.NewGuid(), execution.Id, node.NodeKey, recheckTime, _clock.UtcNow);
                        _db.ScheduledTasks.Add(scheduledTask);
                        execution.SetWaiting(new WaitState(recheckTime, "Wait until goal met", scheduledTask.Id));
                        break;
                    }
                }
            }
            else if (node.Type.Equals("End", StringComparison.OrdinalIgnoreCase))
            {
                sw.Stop();
                var step = new ExecutionStep(stepId, execution.Id, node.NodeKey, 1, inputJson, "{\"completed\":true,\"reason\":\"Reached End node\"}", "{}", ExecutionStatus.Completed, _clock.UtcNow, sw.ElapsedMilliseconds);
                _db.ExecutionSteps.Add(step);
                execution.Complete(_clock.UtcNow);
                break;
            }
            else
            {
                sw.Stop();
                var step = new ExecutionStep(stepId, execution.Id, node.NodeKey, 1, inputJson, "{}", "{}", ExecutionStatus.Completed, _clock.UtcNow, sw.ElapsedMilliseconds);
                _db.ExecutionSteps.Add(step);
            }

            execution.UpdateContext(JsonSerializer.Serialize(state, JsonOptions));

            var nextEdge = graph.Edges.FirstOrDefault(e => e.SourceNodeKey == node.NodeKey && e.SourcePort.Equals(selectedPort, StringComparison.OrdinalIgnoreCase))
                ?? graph.Edges.FirstOrDefault(e => e.SourceNodeKey == node.NodeKey && e.SourcePort.Equals(NodePort.Default, StringComparison.OrdinalIgnoreCase))
                ?? graph.Edges.FirstOrDefault(e => e.SourceNodeKey == node.NodeKey);

            if (nextEdge == null)
            {
                execution.Complete(_clock.UtcNow);
                break;
            }

            execution.MoveToNode(nextEdge.TargetNodeKey, JsonSerializer.Serialize(state, JsonOptions));
        }

        if (stepCount >= maxSteps && execution.Status == ExecutionStatus.Running)
        {
            execution.Fail(_clock.UtcNow);
        }
    }

    private static bool TryGetPropertyCaseInsensitive(JsonElement elem, string name, out JsonElement result)
    {
        if (elem.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in elem.EnumerateObject())
            {
                if (string.Equals(prop.Name, name, StringComparison.OrdinalIgnoreCase))
                {
                    result = prop.Value;
                    return true;
                }
            }
        }

        result = default;
        return false;
    }

    private static ExecutionState ParseInitialState(string contextJson, string? subjectId)
    {
        var state = new ExecutionState();
        if (!string.IsNullOrWhiteSpace(subjectId)) state.Contact.Id = subjectId;

        if (string.IsNullOrWhiteSpace(contextJson) || contextJson.Trim() == "{}") return state;

        try
        {
            using var doc = JsonDocument.Parse(contextJson);
            var root = doc.RootElement;

            if (TryGetPropertyCaseInsensitive(root, "contact", out var contactElem) && contactElem.ValueKind == JsonValueKind.Object)
            {
                var parsedContact = JsonSerializer.Deserialize<ContactState>(contactElem.GetRawText(), JsonOptions);
                if (parsedContact != null) state.Contact = parsedContact;
            }

            if (TryGetPropertyCaseInsensitive(root, "variables", out var varsElem) && varsElem.ValueKind == JsonValueKind.Object)
            {
                foreach (var prop in varsElem.EnumerateObject())
                {
                    state.Variables[prop.Name] = prop.Value.GetString() ?? prop.Value.GetRawText();
                }
            }

            if (TryGetPropertyCaseInsensitive(root, "score", out var scoreProp))
            {
                if (scoreProp.ValueKind == JsonValueKind.Number && scoreProp.TryGetDouble(out var s))
                {
                    state.Contact.Score = s;
                }
                else if (scoreProp.ValueKind == JsonValueKind.String && double.TryParse(scoreProp.GetString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var sParsed))
                {
                    state.Contact.Score = sParsed;
                }
            }
            if (TryGetPropertyCaseInsensitive(root, "email", out var emailProp))
            {
                state.Contact.Email = emailProp.GetString() ?? string.Empty;
            }
            if (TryGetPropertyCaseInsensitive(root, "tags", out var tagsProp) && tagsProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var t in tagsProp.EnumerateArray())
                {
                    var tag = t.GetString();
                    if (!string.IsNullOrWhiteSpace(tag) && !state.Contact.Tags.Contains(tag))
                    {
                        state.Contact.Tags.Add(tag);
                    }
                }
            }
        }
        catch { }

        return state;
    }

    private static void MergeContext(ExecutionState state, string contextJson)
    {
        var incoming = ParseInitialState(contextJson, null);
        if (!string.IsNullOrWhiteSpace(incoming.Contact.Email)) state.Contact.Email = incoming.Contact.Email;
        if (!string.IsNullOrWhiteSpace(incoming.Contact.FirstName)) state.Contact.FirstName = incoming.Contact.FirstName;
        if (!string.IsNullOrWhiteSpace(incoming.Contact.LastName)) state.Contact.LastName = incoming.Contact.LastName;
        if (!string.IsNullOrWhiteSpace(incoming.Contact.Phone)) state.Contact.Phone = incoming.Contact.Phone;
        if (incoming.Contact.Score.HasValue) state.Contact.Score = incoming.Contact.Score;

        foreach (var tag in incoming.Contact.Tags)
        {
            if (!state.Contact.Tags.Contains(tag)) state.Contact.Tags.Add(tag);
        }

        foreach (var (k, v) in incoming.Contact.CustomFields)
        {
            state.Contact.CustomFields[k] = v;
        }

        foreach (var (k, v) in incoming.Variables)
        {
            state.Variables[k] = v;
        }
    }

    private static void ApplySetContactField(string configJson, ExecutionState state)
    {
        if (string.IsNullOrWhiteSpace(configJson)) return;

        try
        {
            using var doc = JsonDocument.Parse(configJson);
            var root = doc.RootElement;

            if (TryGetPropertyCaseInsensitive(root, "field", out var fProp) && TryGetPropertyCaseInsensitive(root, "value", out var vProp))
            {
                string field = fProp.GetString() ?? string.Empty;
                string val = vProp.GetString() ?? vProp.GetRawText();

                switch (field.ToLowerInvariant())
                {
                    case "email": state.Contact.Email = val; break;
                    case "firstname": state.Contact.FirstName = val; break;
                    case "lastname": state.Contact.LastName = val; break;
                    case "phone": state.Contact.Phone = val; break;
                    case "score":
                        if (double.TryParse(val, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var d)) state.Contact.Score = d;
                        break;
                    default:
                        state.Contact.CustomFields[field] = val;
                        break;
                }
            }
            else
            {
                foreach (var prop in root.EnumerateObject())
                {
                    switch (prop.Name.ToLowerInvariant())
                    {
                        case "email": state.Contact.Email = prop.Value.GetString() ?? string.Empty; break;
                        case "firstname": state.Contact.FirstName = prop.Value.GetString() ?? string.Empty; break;
                        case "lastname": state.Contact.LastName = prop.Value.GetString() ?? string.Empty; break;
                        case "phone": state.Contact.Phone = prop.Value.GetString() ?? string.Empty; break;
                        case "score":
                            if (prop.Value.TryGetDouble(out var s)) state.Contact.Score = s;
                            else if (double.TryParse(prop.Value.GetString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var sd)) state.Contact.Score = sd;
                            break;
                        default:
                            state.Contact.CustomFields[prop.Name] = prop.Value.GetString() ?? prop.Value.GetRawText();
                            break;
                    }
                }
            }
        }
        catch { }
    }

    private static List<string> ApplyAddTag(string configJson, ExecutionState state)
    {
        var added = new List<string>();
        if (string.IsNullOrWhiteSpace(configJson)) return added;

        try
        {
            using var doc = JsonDocument.Parse(configJson);
            var root = doc.RootElement;

            if (TryGetPropertyCaseInsensitive(root, "tag", out var singleTag))
            {
                var t = singleTag.GetString();
                if (!string.IsNullOrWhiteSpace(t) && !state.Contact.Tags.Contains(t))
                {
                    state.Contact.Tags.Add(t);
                    added.Add(t);
                }
            }

            if (TryGetPropertyCaseInsensitive(root, "tags", out var multiTags) && multiTags.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in multiTags.EnumerateArray())
                {
                    var t = item.GetString();
                    if (!string.IsNullOrWhiteSpace(t) && !state.Contact.Tags.Contains(t))
                    {
                        state.Contact.Tags.Add(t);
                        added.Add(t);
                    }
                }
            }
        }
        catch { }

        return added;
    }

    private static List<string> ApplyRemoveTag(string configJson, ExecutionState state)
    {
        var removed = new List<string>();
        if (string.IsNullOrWhiteSpace(configJson)) return removed;

        try
        {
            using var doc = JsonDocument.Parse(configJson);
            var root = doc.RootElement;

            if (TryGetPropertyCaseInsensitive(root, "tag", out var singleTag))
            {
                var t = singleTag.GetString();
                if (!string.IsNullOrWhiteSpace(t) && state.Contact.Tags.Remove(t))
                {
                    removed.Add(t);
                }
            }

            if (TryGetPropertyCaseInsensitive(root, "tags", out var multiTags) && multiTags.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in multiTags.EnumerateArray())
                {
                    var t = item.GetString();
                    if (!string.IsNullOrWhiteSpace(t) && state.Contact.Tags.Remove(t))
                    {
                        removed.Add(t);
                    }
                }
            }
        }
        catch { }

        return removed;
    }

    private static TimeSpan ParseWaitDuration(string configJson)
    {
        if (string.IsNullOrWhiteSpace(configJson)) return TimeSpan.FromMinutes(10);

        try
        {
            using var doc = JsonDocument.Parse(configJson);
            var root = doc.RootElement;

            if (TryGetPropertyCaseInsensitive(root, "duration", out var durProp) && TimeSpan.TryParse(durProp.GetString(), out var ts))
            {
                return ts;
            }

            if (TryGetPropertyCaseInsensitive(root, "amount", out var amountProp) && amountProp.TryGetInt32(out var amount))
            {
                string unit = "minutes";
                if (TryGetPropertyCaseInsensitive(root, "unit", out var unitProp))
                {
                    unit = unitProp.GetString()?.ToLowerInvariant() ?? "minutes";
                }

                return unit switch
                {
                    "seconds" => TimeSpan.FromSeconds(amount),
                    "minutes" => TimeSpan.FromMinutes(amount),
                    "hours" => TimeSpan.FromHours(amount),
                    "days" => TimeSpan.FromDays(amount),
                    _ => TimeSpan.FromMinutes(amount)
                };
            }
        }
        catch { }

        return TimeSpan.FromMinutes(10);
    }

    private (bool Achieved, string Policy, ConditionEvaluationResult EvalResult) EvaluateGoal(string configJson, ExecutionState state)
    {
        string policy = "EndWorkflow";
        var evalResult = new ConditionEvaluationResult { IsMatched = true };

        if (string.IsNullOrWhiteSpace(configJson))
        {
            return (true, policy, evalResult);
        }

        try
        {
            using var doc = JsonDocument.Parse(configJson);
            var root = doc.RootElement;

            if (TryGetPropertyCaseInsensitive(root, "policy", out var polProp))
            {
                policy = polProp.GetString() ?? "EndWorkflow";
            }

            if (TryGetPropertyCaseInsensitive(root, "condition", out var condProp))
            {
                evalResult = _conditionEvaluator.Evaluate(condProp.GetRawText(), state);
            }
            else
            {
                evalResult = _conditionEvaluator.Evaluate(configJson, state);
            }
        }
        catch { }

        return (evalResult.IsMatched, policy, evalResult);
    }
}
