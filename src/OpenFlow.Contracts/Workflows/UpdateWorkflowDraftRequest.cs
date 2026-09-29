namespace OpenFlow.Contracts.Workflows;

public class UpdateWorkflowDraftRequest
{
    public Guid WorkflowId { get; set; }
    public WorkflowGraphDto Graph { get; set; } = new();
}
