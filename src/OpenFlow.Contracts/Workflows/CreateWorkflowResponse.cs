namespace OpenFlow.Contracts.Workflows;

public class CreateWorkflowResponse
{
    public Guid WorkflowId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}
