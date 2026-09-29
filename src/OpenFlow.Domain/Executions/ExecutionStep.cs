using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Executions;

public class ExecutionStep : Entity<Guid>
{
    public Guid ExecutionId { get; private set; }
    public string NodeKey { get; private set; } = string.Empty;
    public int Attempt { get; private set; }
    public string InputJson { get; private set; } = "{}";
    public string OutputJson { get; private set; } = "{}";
    public string StateDiffJson { get; private set; } = "{}";
    public ExecutionStatus Status { get; private set; }
    public string? ErrorMessage { get; private set; }
    public DateTime ExecutedAtUtc { get; private set; }
    public long DurationMs { get; private set; }

    private ExecutionStep() { }

    public ExecutionStep(Guid id, Guid executionId, string nodeKey, int attempt, string inputJson, string outputJson, string stateDiffJson, ExecutionStatus status, DateTime executedAtUtc, long durationMs, string? error = null)
        : base(id)
    {
        ExecutionId = executionId;
        NodeKey = nodeKey;
        Attempt = attempt;
        InputJson = inputJson;
        OutputJson = outputJson;
        StateDiffJson = stateDiffJson;
        Status = status;
        ExecutedAtUtc = executedAtUtc;
        DurationMs = durationMs;
        ErrorMessage = error;
    }

    public static ExecutionStep Start(Guid id, Guid executionId, string nodeKey, int attempt, string inputJson, DateTime executedAtUtc)
    {
        return new ExecutionStep(id, executionId, nodeKey, attempt, inputJson, "{}", "{}", ExecutionStatus.Running, executedAtUtc, 0);
    }

    public void Complete(string outputJson, string stateDiffJson, long durationMs)
    {
        OutputJson = outputJson;
        StateDiffJson = stateDiffJson;
        Status = ExecutionStatus.Completed;
        DurationMs = durationMs;
    }

    public void Fail(string error, long durationMs)
    {
        ErrorMessage = error;
        Status = ExecutionStatus.Failed;
        DurationMs = durationMs;
    }
}
