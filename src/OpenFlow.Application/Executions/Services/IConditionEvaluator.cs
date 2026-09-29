using OpenFlow.Domain.Executions;

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
