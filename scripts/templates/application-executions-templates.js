// application-executions-templates.js
// Execution and Simulation slice: CQRS handlers, execution engine, evaluation, and simulation engine

export const applicationExecutionsTemplates = {
  'src/OpenFlow.Application/Executions/Commands/StartExecution/StartExecutionCommand.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Executions;

namespace OpenFlow.Application.Executions.Commands.StartExecution;

public record StartExecutionCommand(
    Guid WorkflowVersionId,
    Guid? SimulationRunId,
    string? SubjectId,
    string InitialContextJson
) : ICommand<ApiResponse<StartExecutionResponse>>;
`,

  'src/OpenFlow.Application/Executions/Commands/StartExecution/StartExecutionValidator.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Application.Executions.Commands.StartExecution;

public class StartExecutionValidator
{
    public Result Validate(StartExecutionCommand command)
    {
        if (command.WorkflowVersionId == Guid.Empty)
            return Result.Failure("WorkflowVersionId is required to start an execution.");
        return Result.Success();
    }
}
`,

  'src/OpenFlow.Application/Executions/Commands/StartExecution/StartExecutionHandler.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Application.Executions.Services;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Executions;

namespace OpenFlow.Application.Executions.Commands.StartExecution;

public class StartExecutionHandler : ICommandHandler<StartExecutionCommand, ApiResponse<StartExecutionResponse>>
{
    private readonly IWorkflowExecutionEngine _engine;
    private readonly StartExecutionValidator _validator = new();

    public StartExecutionHandler(IWorkflowExecutionEngine engine) => _engine = engine;

    public async Task<ApiResponse<StartExecutionResponse>> HandleAsync(StartExecutionCommand command, CancellationToken ct = default)
    {
        var validation = _validator.Validate(command);
        if (validation.IsFailure) return ApiResponse<StartExecutionResponse>.Fail(validation.Error);

        var result = await _engine.StartExecutionAsync(command.WorkflowVersionId, command.SimulationRunId, command.SubjectId, command.InitialContextJson, ct);
        if (result.IsFailure) return ApiResponse<StartExecutionResponse>.Fail(result.Error);

        var execution = result.Value!;
        return ApiResponse<StartExecutionResponse>.Ok(new StartExecutionResponse
        {
            ExecutionId = execution.Id,
            Status = execution.Status.ToString(),
            StartNodeKey = execution.CurrentNodeKey
        });
    }
}
`,

  'src/OpenFlow.Application/Executions/Commands/ResumeExecution/ResumeExecutionCommand.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;

namespace OpenFlow.Application.Executions.Commands.ResumeExecution;

public record ResumeExecutionCommand(Guid ExecutionId, string NodeKey, string ContextJson) : ICommand<ApiResponse<bool>>;
`,

  'src/OpenFlow.Application/Executions/Commands/ResumeExecution/ResumeExecutionValidator.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Application.Executions.Commands.ResumeExecution;

public class ResumeExecutionValidator
{
    public Result Validate(ResumeExecutionCommand command)
    {
        if (command.ExecutionId == Guid.Empty) return Result.Failure("ExecutionId is required.");
        if (string.IsNullOrWhiteSpace(command.NodeKey)) return Result.Failure("NodeKey is required to resume.");
        return Result.Success();
    }
}
`,

  'src/OpenFlow.Application/Executions/Commands/ResumeExecution/ResumeExecutionHandler.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Application.Executions.Services;
using OpenFlow.Contracts.Common;

namespace OpenFlow.Application.Executions.Commands.ResumeExecution;

public class ResumeExecutionHandler : ICommandHandler<ResumeExecutionCommand, ApiResponse<bool>>
{
    private readonly IWorkflowExecutionEngine _engine;
    private readonly ResumeExecutionValidator _validator = new();

    public ResumeExecutionHandler(IWorkflowExecutionEngine engine) => _engine = engine;

    public async Task<ApiResponse<bool>> HandleAsync(ResumeExecutionCommand command, CancellationToken ct = default)
    {
        var validation = _validator.Validate(command);
        if (validation.IsFailure) return ApiResponse<bool>.Fail(validation.Error);

        var result = await _engine.ResumeExecutionAsync(command.ExecutionId, command.NodeKey, command.ContextJson, ct);
        return result.IsSuccess ? ApiResponse<bool>.Ok(true) : ApiResponse<bool>.Fail(result.Error);
    }
}
`,

  'src/OpenFlow.Application/Executions/Commands/CancelExecution/CancelExecutionCommand.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;

namespace OpenFlow.Application.Executions.Commands.CancelExecution;

public record CancelExecutionCommand(Guid ExecutionId) : ICommand<ApiResponse<bool>>;
`,

  'src/OpenFlow.Application/Executions/Commands/CancelExecution/CancelExecutionValidator.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Application.Executions.Commands.CancelExecution;

public class CancelExecutionValidator
{
    public Result Validate(CancelExecutionCommand command)
    {
        if (command.ExecutionId == Guid.Empty) return Result.Failure("ExecutionId is required.");
        return Result.Success();
    }
}
`,

  'src/OpenFlow.Application/Executions/Commands/CancelExecution/CancelExecutionHandler.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;

namespace OpenFlow.Application.Executions.Commands.CancelExecution;

public class CancelExecutionHandler : ICommandHandler<CancelExecutionCommand, ApiResponse<bool>>
{
    private readonly IApplicationDbContext _db;
    private readonly ISimulationClock _clock;

    public CancelExecutionHandler(IApplicationDbContext db, ISimulationClock clock)
    {
        _db = db;
        _clock = clock;
    }

    public async Task<ApiResponse<bool>> HandleAsync(CancelExecutionCommand command, CancellationToken ct = default)
    {
        var execution = _db.Executions.FirstOrDefault(e => e.Id == command.ExecutionId);
        if (execution == null) return ApiResponse<bool>.Fail("Execution not found.");

        execution.Cancel(_clock.UtcNow);
        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
`,

  'src/OpenFlow.Application/Executions/Commands/RetryExecutionStep/RetryExecutionStepCommand.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;

namespace OpenFlow.Application.Executions.Commands.RetryExecutionStep;

public record RetryExecutionStepCommand(Guid ExecutionId, string NodeKey) : ICommand<ApiResponse<bool>>;
`,

  'src/OpenFlow.Application/Executions/Commands/RetryExecutionStep/RetryExecutionStepValidator.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Application.Executions.Commands.RetryExecutionStep;

public class RetryExecutionStepValidator
{
    public Result Validate(RetryExecutionStepCommand command)
    {
        if (command.ExecutionId == Guid.Empty) return Result.Failure("ExecutionId is required.");
        if (string.IsNullOrWhiteSpace(command.NodeKey)) return Result.Failure("NodeKey is required.");
        return Result.Success();
    }
}
`,

  'src/OpenFlow.Application/Executions/Commands/RetryExecutionStep/RetryExecutionStepHandler.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Application.Executions.Services;
using OpenFlow.Contracts.Common;

namespace OpenFlow.Application.Executions.Commands.RetryExecutionStep;

public class RetryExecutionStepHandler : ICommandHandler<RetryExecutionStepCommand, ApiResponse<bool>>
{
    private readonly IWorkflowExecutionEngine _engine;

    public RetryExecutionStepHandler(IWorkflowExecutionEngine engine) => _engine = engine;

    public async Task<ApiResponse<bool>> HandleAsync(RetryExecutionStepCommand command, CancellationToken ct = default)
    {
        var result = await _engine.ResumeExecutionAsync(command.ExecutionId, command.NodeKey, "{}", ct);
        return result.IsSuccess ? ApiResponse<bool>.Ok(true) : ApiResponse<bool>.Fail(result.Error);
    }
}
`,

  'src/OpenFlow.Application/Executions/Queries/GetExecutionTrace/GetExecutionTraceQuery.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Executions;

namespace OpenFlow.Application.Executions.Queries.GetExecutionTrace;

public record GetExecutionTraceQuery(Guid ExecutionId) : IQuery<ApiResponse<ExecutionTraceDto>>;
`,

  'src/OpenFlow.Application/Executions/Queries/GetExecutionTrace/GetExecutionTraceHandler.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Executions;

namespace OpenFlow.Application.Executions.Queries.GetExecutionTrace;

public class GetExecutionTraceHandler : IQueryHandler<GetExecutionTraceQuery, ApiResponse<ExecutionTraceDto>>
{
    private readonly IApplicationDbContext _db;

    public GetExecutionTraceHandler(IApplicationDbContext db) => _db = db;

    public Task<ApiResponse<ExecutionTraceDto>> HandleAsync(GetExecutionTraceQuery query, CancellationToken ct = default)
    {
        var execution = _db.Executions.FirstOrDefault(e => e.Id == query.ExecutionId);
        if (execution == null) return Task.FromResult(ApiResponse<ExecutionTraceDto>.Fail("Execution not found."));

        var steps = _db.ExecutionSteps
            .Where(s => s.ExecutionId == query.ExecutionId)
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

        var trace = new ExecutionTraceDto
        {
            ExecutionId = execution.Id,
            Status = execution.Status.ToString(),
            Steps = steps
        };

        return Task.FromResult(ApiResponse<ExecutionTraceDto>.Ok(trace));
    }
}
`,

  'src/OpenFlow.Application/Executions/Queries/ListExecutions/ListExecutionsQuery.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Executions;

namespace OpenFlow.Application.Executions.Queries.ListExecutions;

public record ListExecutionsQuery(int Page = 1, int PageSize = 20) : IQuery<ApiResponse<PagedList<ExecutionTraceDto>>>;
`,

  'src/OpenFlow.Application/Executions/Queries/ListExecutions/ListExecutionsHandler.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Executions;

namespace OpenFlow.Application.Executions.Queries.ListExecutions;

public class ListExecutionsHandler : IQueryHandler<ListExecutionsQuery, ApiResponse<PagedList<ExecutionTraceDto>>>
{
    private readonly IApplicationDbContext _db;

    public ListExecutionsHandler(IApplicationDbContext db) => _db = db;

    public Task<ApiResponse<PagedList<ExecutionTraceDto>>> HandleAsync(ListExecutionsQuery query, CancellationToken ct = default)
    {
        var items = _db.Executions
            .OrderByDescending(e => e.CreatedAtUtc)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(e => new ExecutionTraceDto
            {
                ExecutionId = e.Id,
                Status = e.Status.ToString(),
                Steps = new()
            })
            .ToList();

        var paged = new PagedList<ExecutionTraceDto>(items, _db.Executions.Count, query.Page, query.PageSize);
        return Task.FromResult(ApiResponse<PagedList<ExecutionTraceDto>>.Ok(paged));
    }
}
`,

  'src/OpenFlow.Application/Executions/Queries/GetExecutionStep/GetExecutionStepQuery.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Executions;

namespace OpenFlow.Application.Executions.Queries.GetExecutionStep;

public record GetExecutionStepQuery(Guid StepId) : IQuery<ApiResponse<ExecutionStepDto>>;
`,

  'src/OpenFlow.Application/Executions/Queries/GetExecutionStep/GetExecutionStepHandler.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Executions;

namespace OpenFlow.Application.Executions.Queries.GetExecutionStep;

public class GetExecutionStepHandler : IQueryHandler<GetExecutionStepQuery, ApiResponse<ExecutionStepDto>>
{
    private readonly IApplicationDbContext _db;

    public GetExecutionStepHandler(IApplicationDbContext db) => _db = db;

    public Task<ApiResponse<ExecutionStepDto>> HandleAsync(GetExecutionStepQuery query, CancellationToken ct = default)
    {
        var s = _db.ExecutionSteps.FirstOrDefault(step => step.Id == query.StepId);
        if (s == null) return Task.FromResult(ApiResponse<ExecutionStepDto>.Fail("Step not found."));

        var dto = new ExecutionStepDto
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
        };

        return Task.FromResult(ApiResponse<ExecutionStepDto>.Ok(dto));
    }
}
`,

  'src/OpenFlow.Application/Executions/Policies/IExecutionRetryPolicy.cs': `using OpenFlow.Domain.Workflows;

namespace OpenFlow.Application.Executions.Policies;

public interface IExecutionRetryPolicy
{
    bool ShouldRetry(NodeType nodeType, int currentAttempt, Exception? exception);
    TimeSpan GetRetryDelay(NodeType nodeType, int currentAttempt);
}
`,

  'src/OpenFlow.Application/Executions/Policies/DefaultExecutionRetryPolicy.cs': `using OpenFlow.Domain.Workflows;

namespace OpenFlow.Application.Executions.Policies;

public class DefaultExecutionRetryPolicy : IExecutionRetryPolicy
{
    private const int MaxAttempts = 3;

    public bool ShouldRetry(NodeType nodeType, int currentAttempt, Exception? exception)
    {
        if (currentAttempt >= MaxAttempts) return false;
        return nodeType switch
        {
            NodeType.Webhook => true,
            NodeType.SendMessage => true,
            _ => false
        };
    }

    public TimeSpan GetRetryDelay(NodeType nodeType, int currentAttempt)
    {
        return TimeSpan.FromSeconds(Math.Pow(2, currentAttempt));
    }
}
`,

  'src/OpenFlow.Application/Executions/Services/IConditionEvaluator.cs': `using OpenFlow.Domain.Executions;

namespace OpenFlow.Application.Executions.Services;

public class ConditionRule
{
    public string Field { get; set; } = string.Empty;
    public string Operator { get; set; } = "equals";
    public object? Value { get; set; }
}

public class ConditionGroup
{
    public string MatchType { get; set; } = "all";
    public List<ConditionRule> Conditions { get; set; } = new();
}

public class ConditionEvaluationDetail
{
    public string Field { get; set; } = string.Empty;
    public string Operator { get; set; } = string.Empty;
    public object? Expected { get; set; }
    public object? Actual { get; set; }
    public bool Matched { get; set; }
}

public class ConditionEvaluationResult
{
    public bool IsMatched { get; set; }
    public List<ConditionEvaluationDetail> EvaluatedRules { get; set; } = new();
}

public interface IConditionEvaluator
{
    ConditionEvaluationResult Evaluate(string configJson, ExecutionState state);
}
`,

  'src/OpenFlow.Application/Executions/Services/ConditionEvaluator.cs': `using System.Globalization;
using System.Text.Json;
using OpenFlow.Domain.Executions;

namespace OpenFlow.Application.Executions.Services;

public class ConditionEvaluator : IConditionEvaluator
{
    public ConditionEvaluationResult Evaluate(string configJson, ExecutionState state)
    {
        var result = new ConditionEvaluationResult { IsMatched = true };

        if (string.IsNullOrWhiteSpace(configJson) || configJson.Trim() == "{}")
        {
            return result;
        }

        try
        {
            using var doc = JsonDocument.Parse(configJson);
            var root = doc.RootElement;

            var rules = new List<ConditionRule>();
            string matchType = "all";

            if (root.TryGetProperty("matchType", out var matchTypeProp))
            {
                matchType = matchTypeProp.GetString() ?? "all";
            }

            if (root.TryGetProperty("conditions", out var conditionsProp) && conditionsProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in conditionsProp.EnumerateArray())
                {
                    rules.Add(ParseRule(item));
                }
            }
            else if (root.TryGetProperty("field", out _))
            {
                rules.Add(ParseRule(root));
            }

            if (rules.Count == 0) return result;

            bool isAny = matchType.Equals("any", StringComparison.OrdinalIgnoreCase);
            bool overallMatch = !isAny;

            foreach (var rule in rules)
            {
                var actual = ResolveFieldValue(rule.Field, state);
                bool matched = MatchRule(rule.Operator, actual, rule.Value);

                result.EvaluatedRules.Add(new ConditionEvaluationDetail
                {
                    Field = rule.Field,
                    Operator = rule.Operator,
                    Expected = rule.Value,
                    Actual = actual,
                    Matched = matched
                });

                if (isAny)
                {
                    if (matched) overallMatch = true;
                }
                else
                {
                    if (!matched) overallMatch = false;
                }
            }

            result.IsMatched = overallMatch;
            return result;
        }
        catch
        {
            result.IsMatched = true;
            return result;
        }
    }

    private static ConditionRule ParseRule(JsonElement elem)
    {
        var rule = new ConditionRule();
        if (elem.TryGetProperty("field", out var f)) rule.Field = f.GetString() ?? string.Empty;
        if (elem.TryGetProperty("operator", out var o)) rule.Operator = o.GetString() ?? "equals";
        if (elem.TryGetProperty("value", out var v)) rule.Value = ConvertJsonElement(v);
        return rule;
    }

    private static object? ConvertJsonElement(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.String => element.GetString(),
            JsonValueKind.Number => element.TryGetInt64(out var l) ? l : element.GetDouble(),
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Array => element.EnumerateArray().Select(ConvertJsonElement).ToList(),
            JsonValueKind.Null => null,
            _ => element.GetRawText()
        };
    }

    private static object? ResolveFieldValue(string fieldPath, ExecutionState state)
    {
        if (string.IsNullOrWhiteSpace(fieldPath)) return null;

        var parts = fieldPath.Trim().Split('.', StringSplitOptions.RemoveEmptyEntries);
        var currentSection = parts[0].ToLowerInvariant();

        if (currentSection == "contact")
        {
            if (parts.Length < 2) return state.Contact;
            var subField = parts[1].ToLowerInvariant();

            return subField switch
            {
                "id" => state.Contact.Id,
                "email" => state.Contact.Email,
                "firstname" => state.Contact.FirstName,
                "lastname" => state.Contact.LastName,
                "phone" => state.Contact.Phone,
                "score" => state.Contact.Score,
                "tags" => state.Contact.Tags,
                "customfields" when parts.Length >= 3 => state.Contact.CustomFields.TryGetValue(parts[2], out var cf) ? cf : null,
                _ => state.Contact.CustomFields.TryGetValue(parts[1], out var cfDirect) ? cfDirect : null
            };
        }
        else if (currentSection == "tags") return state.Contact.Tags;
        else if (currentSection == "score") return state.Contact.Score;
        else if (currentSection == "email") return state.Contact.Email;
        else if (currentSection == "firstname") return state.Contact.FirstName;
        else if (currentSection == "lastname") return state.Contact.LastName;
        else if (currentSection == "variables" && parts.Length >= 2)
        {
            return state.Variables.TryGetValue(parts[1], out var v) ? v : null;
        }
        else
        {
            if (state.Contact.CustomFields.TryGetValue(fieldPath, out var cf)) return cf;
            if (state.Variables.TryGetValue(fieldPath, out var varVal)) return varVal;
            return null;
        }
    }

    private static bool MatchRule(string op, object? actual, object? expected)
    {
        string normalizedOp = op?.ToLowerInvariant().Trim() ?? "equals";

        return normalizedOp switch
        {
            "equals" or "eq" or "==" => CompareEquals(actual, expected),
            "notequals" or "neq" or "!=" => !CompareEquals(actual, expected),
            "contains" => CheckContains(actual, expected),
            "notcontains" => !CheckContains(actual, expected),
            "greaterthan" or "gt" or ">" => CompareNumeric(actual, expected) > 0,
            "greaterthanorequal" or "gte" or ">=" => CompareNumeric(actual, expected) >= 0,
            "lessthan" or "lt" or "<" => CompareNumeric(actual, expected) < 0,
            "lessthanorequal" or "lte" or "<=" => CompareNumeric(actual, expected) <= 0,
            "in" => CheckIn(actual, expected),
            "notin" => !CheckIn(actual, expected),
            "exists" or "isnotempty" => actual != null && !string.IsNullOrWhiteSpace(actual.ToString()),
            "notexists" or "isempty" => actual == null || string.IsNullOrWhiteSpace(actual.ToString()),
            _ => CompareEquals(actual, expected)
        };
    }

    private static bool CompareEquals(object? actual, object? expected)
    {
        if (actual == null && expected == null) return true;
        if (actual == null || expected == null) return false;

        if (TryConvertToDouble(actual, out var aNum) && TryConvertToDouble(expected, out var eNum))
        {
            return Math.Abs(aNum - eNum) < 0.000001;
        }

        return string.Equals(actual.ToString()?.Trim(), expected.ToString()?.Trim(), StringComparison.OrdinalIgnoreCase);
    }

    private static int CompareNumeric(object? actual, object? expected)
    {
        if (actual == null || expected == null) return -1;

        if (TryConvertToDouble(actual, out var aNum) && TryConvertToDouble(expected, out var eNum))
        {
            return aNum.CompareTo(eNum);
        }

        return string.Compare(actual.ToString(), expected.ToString(), StringComparison.OrdinalIgnoreCase);
    }

    private static bool CheckContains(object? actual, object? expected)
    {
        if (actual == null || expected == null) return false;

        string expStr = expected.ToString()?.Trim() ?? string.Empty;

        if (actual is IEnumerable<string> stringList)
        {
            return stringList.Any(s => string.Equals(s, expStr, StringComparison.OrdinalIgnoreCase));
        }

        return actual.ToString()?.Contains(expStr, StringComparison.OrdinalIgnoreCase) ?? false;
    }

    private static bool CheckIn(object? actual, object? expected)
    {
        if (actual == null || expected == null) return false;

        string actStr = actual.ToString()?.Trim() ?? string.Empty;

        if (expected is IEnumerable<object> expList)
        {
            return expList.Any(e => string.Equals(e?.ToString()?.Trim(), actStr, StringComparison.OrdinalIgnoreCase));
        }

        if (expected is IEnumerable<string> strList)
        {
            return strList.Any(e => string.Equals(e.Trim(), actStr, StringComparison.OrdinalIgnoreCase));
        }

        return false;
    }

    private static bool TryConvertToDouble(object value, out double result)
    {
        result = 0;
        if (value is double d) { result = d; return true; }
        if (value is float f) { result = f; return true; }
        if (value is int i) { result = i; return true; }
        if (value is long l) { result = l; return true; }
        if (value is decimal dec) { result = (double)dec; return true; }

        return double.TryParse(value.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out result);
    }
}
`,

  'src/OpenFlow.Application/Executions/Services/IWorkflowExecutionEngine.cs': `using OpenFlow.Domain.Common;
using OpenFlow.Domain.Executions;

namespace OpenFlow.Application.Executions.Services;

public interface IWorkflowExecutionEngine
{
    Task<Result<Execution>> StartExecutionAsync(Guid versionId, Guid? simulationRunId, string? subjectId, string initialContextJson, CancellationToken ct = default);
    Task<Result> ResumeExecutionAsync(Guid executionId, string nodeKey, string contextJson, CancellationToken ct = default);
}
`,

  'src/OpenFlow.Application/Executions/Services/WorkflowExecutionEngine.cs': `using System.Diagnostics;
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
                var step = new ExecutionStep(stepId, execution.Id, node.NodeKey, 1, inputJson, "{\\"triggered\\":true}", diffJson, ExecutionStatus.Completed, _clock.UtcNow, sw.ElapsedMilliseconds);
                _db.ExecutionSteps.Add(step);
            }
            else if (node.Type.Equals("SetContactField", StringComparison.OrdinalIgnoreCase))
            {
                ApplySetContactField(node.ConfigJson, state);
                sw.Stop();
                var diff = ExecutionState.CalculateDiff(stateBefore, state);
                var diffJson = JsonSerializer.Serialize(diff, JsonOptions);
                var step = new ExecutionStep(stepId, execution.Id, node.NodeKey, 1, inputJson, "{\\"mutated\\":true}", diffJson, ExecutionStatus.Completed, _clock.UtcNow, sw.ElapsedMilliseconds);
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
                var step = new ExecutionStep(stepId, execution.Id, node.NodeKey, 1, inputJson, "{\\"completed\\":true,\\"reason\\":\\"Reached End node\\"}", "{}", ExecutionStatus.Completed, _clock.UtcNow, sw.ElapsedMilliseconds);
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
`,

  'src/OpenFlow.Application/SimulationRuns/Services/ISimulationEngine.cs': `using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.SimulationRuns;
using OpenFlow.Domain.Common;

namespace OpenFlow.Application.SimulationRuns.Services;

public interface ISimulationEngine
{
    Task<Result<SimulationResultDto>> StartSimulationAsync(StartSimulationRequest request, CancellationToken ct = default);
    Task<Result<SimulationResultDto>> AdvanceClockAsync(Guid simulationRunId, int? minutes, bool advanceToNextTask, CancellationToken ct = default);
    Task<Result<SimulationResultDto>> GetSimulationResultAsync(Guid simulationRunId, CancellationToken ct = default);
}
`,

  'src/OpenFlow.Application/SimulationRuns/Services/SimulationEngine.cs': `using OpenFlow.Application.Abstractions;
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
`,

  'src/OpenFlow.Application/SimulationRuns/Commands/StartSimulationRun/StartSimulationRunCommand.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.SimulationRuns;

namespace OpenFlow.Application.SimulationRuns.Commands.StartSimulationRun;

public record StartSimulationRunCommand(StartSimulationRequest Request) : ICommand<ApiResponse<SimulationResultDto>>;
`,

  'src/OpenFlow.Application/SimulationRuns/Commands/StartSimulationRun/StartSimulationRunValidator.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Application.SimulationRuns.Commands.StartSimulationRun;

public class StartSimulationRunValidator
{
    public Result Validate(StartSimulationRunCommand command)
    {
        if (command.Request == null) return Result.Failure("Request body cannot be null.");
        if (command.Request.WorkflowVersionId == Guid.Empty) return Result.Failure("WorkflowVersionId is required.");
        return Result.Success();
    }
}
`,

  'src/OpenFlow.Application/SimulationRuns/Commands/StartSimulationRun/StartSimulationRunHandler.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Application.SimulationRuns.Services;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.SimulationRuns;

namespace OpenFlow.Application.SimulationRuns.Commands.StartSimulationRun;

public class StartSimulationRunHandler : ICommandHandler<StartSimulationRunCommand, ApiResponse<SimulationResultDto>>
{
    private readonly ISimulationEngine _simulationEngine;
    private readonly StartSimulationRunValidator _validator;

    public StartSimulationRunHandler(ISimulationEngine simulationEngine, StartSimulationRunValidator? validator = null)
    {
        _simulationEngine = simulationEngine;
        _validator = validator ?? new StartSimulationRunValidator();
    }

    public async Task<ApiResponse<SimulationResultDto>> HandleAsync(StartSimulationRunCommand command, CancellationToken ct = default)
    {
        var validation = _validator.Validate(command);
        if (validation.IsFailure) return ApiResponse<SimulationResultDto>.Fail(validation.Error);

        var result = await _simulationEngine.StartSimulationAsync(command.Request, ct);
        return result.IsSuccess
            ? ApiResponse<SimulationResultDto>.Ok(result.Value!)
            : ApiResponse<SimulationResultDto>.Fail(result.Error);
    }
}
`,

  'src/OpenFlow.Application/SimulationRuns/Commands/AdvanceSimulationClock/AdvanceSimulationClockCommand.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.SimulationRuns;

namespace OpenFlow.Application.SimulationRuns.Commands.AdvanceSimulationClock;

public record AdvanceSimulationClockCommand(
    Guid SimulationRunId,
    int? Minutes,
    bool AdvanceToNextTask = true
) : ICommand<ApiResponse<SimulationResultDto>>;
`,

  'src/OpenFlow.Application/SimulationRuns/Commands/AdvanceSimulationClock/AdvanceSimulationClockValidator.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Application.SimulationRuns.Commands.AdvanceSimulationClock;

public class AdvanceSimulationClockValidator
{
    public Result Validate(AdvanceSimulationClockCommand command)
    {
        if (command.SimulationRunId == Guid.Empty) return Result.Failure("SimulationRunId is required.");
        return Result.Success();
    }
}
`,

  'src/OpenFlow.Application/SimulationRuns/Commands/AdvanceSimulationClock/AdvanceSimulationClockHandler.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Application.SimulationRuns.Services;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.SimulationRuns;

namespace OpenFlow.Application.SimulationRuns.Commands.AdvanceSimulationClock;

public class AdvanceSimulationClockHandler : ICommandHandler<AdvanceSimulationClockCommand, ApiResponse<SimulationResultDto>>
{
    private readonly ISimulationEngine _simulationEngine;
    private readonly AdvanceSimulationClockValidator _validator;

    public AdvanceSimulationClockHandler(ISimulationEngine simulationEngine, AdvanceSimulationClockValidator? validator = null)
    {
        _simulationEngine = simulationEngine;
        _validator = validator ?? new AdvanceSimulationClockValidator();
    }

    public async Task<ApiResponse<SimulationResultDto>> HandleAsync(AdvanceSimulationClockCommand command, CancellationToken ct = default)
    {
        var validation = _validator.Validate(command);
        if (validation.IsFailure) return ApiResponse<SimulationResultDto>.Fail(validation.Error);

        var result = await _simulationEngine.AdvanceClockAsync(command.SimulationRunId, command.Minutes, command.AdvanceToNextTask, ct);
        return result.IsSuccess
            ? ApiResponse<SimulationResultDto>.Ok(result.Value!)
            : ApiResponse<SimulationResultDto>.Fail(result.Error);
    }
}
`,

  'src/OpenFlow.Application/SimulationRuns/Queries/GetSimulationRun/GetSimulationRunQuery.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.SimulationRuns;

namespace OpenFlow.Application.SimulationRuns.Queries.GetSimulationRun;

public record GetSimulationRunQuery(Guid SimulationRunId) : IQuery<ApiResponse<SimulationResultDto>>;
`,

  'src/OpenFlow.Application/SimulationRuns/Queries/GetSimulationRun/GetSimulationRunHandler.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Application.SimulationRuns.Services;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.SimulationRuns;

namespace OpenFlow.Application.SimulationRuns.Queries.GetSimulationRun;

public class GetSimulationRunHandler : IQueryHandler<GetSimulationRunQuery, ApiResponse<SimulationResultDto>>
{
    private readonly ISimulationEngine _simulationEngine;

    public GetSimulationRunHandler(ISimulationEngine simulationEngine) => _simulationEngine = simulationEngine;

    public async Task<ApiResponse<SimulationResultDto>> HandleAsync(GetSimulationRunQuery query, CancellationToken ct = default)
    {
        if (query.SimulationRunId == Guid.Empty)
            return ApiResponse<SimulationResultDto>.Fail("SimulationRunId is required.");

        var result = await _simulationEngine.GetSimulationResultAsync(query.SimulationRunId, ct);
        return result.IsSuccess
            ? ApiResponse<SimulationResultDto>.Ok(result.Value!)
            : ApiResponse<SimulationResultDto>.Fail(result.Error);
    }
}
`,

};
