namespace OpenFlow.Contracts.Executions;

public class ExecutionTraceDto
{
    public Guid ExecutionId { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<ExecutionStepDto> Steps { get; set; } = new();
}
