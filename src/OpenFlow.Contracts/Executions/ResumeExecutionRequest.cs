namespace OpenFlow.Contracts.Executions;

public class ResumeExecutionRequest
{
    public Guid ExecutionId { get; set; }
    public string NodeKey { get; set; } = string.Empty;
    public string ContextJson { get; set; } = "{}";
}
