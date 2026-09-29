namespace OpenFlow.Contracts.Executions;

public class ExecutionStepDto
{
    public Guid Id { get; set; }
    public string NodeKey { get; set; } = string.Empty;
    public int Attempt { get; set; }
    public string InputJson { get; set; } = "{}";
    public string OutputJson { get; set; } = "{}";
    public string StateDiffJson { get; set; } = "{}";
    public string Status { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
    public long DurationMs { get; set; }
    public DateTime ExecutedAtUtc { get; set; }
}
