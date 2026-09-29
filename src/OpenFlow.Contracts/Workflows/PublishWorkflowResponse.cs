namespace OpenFlow.Contracts.Workflows;

public class PublishWorkflowResponse
{
    public Guid WorkflowId { get; set; }
    public Guid PublishedVersionId { get; set; }
    public int VersionNumber { get; set; }
    public DateTime PublishedAtUtc { get; set; }
}
