namespace OpenFlow.Contracts.Executions;

public class StartExecutionResponse
{
    public Guid ExecutionId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string StartNodeKey { get; set; } = string.Empty;
}
