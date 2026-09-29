namespace OpenFlow.Contracts.Workflows;

public class WorkflowDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid? CurrentDraftVersionId { get; set; }
    public Guid? PublishedVersionId { get; set; }
    public int LatestVersionNumber { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
