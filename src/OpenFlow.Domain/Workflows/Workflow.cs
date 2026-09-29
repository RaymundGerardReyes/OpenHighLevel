using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Workflows;

public class Workflow : AggregateRoot<Guid>
{
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public WorkflowStatus Status { get; private set; } = WorkflowStatus.Draft;
    public Guid? CurrentDraftVersionId { get; private set; }
    public Guid? PublishedVersionId { get; private set; }
    public int LatestVersionNumber { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }

    private Workflow() { }

    public Workflow(Guid id, string name, string description, DateTime createdAtUtc) : base(id)
    {
        Name = name;
        Description = description;
        Status = WorkflowStatus.Draft;
        CreatedAtUtc = createdAtUtc;
        UpdatedAtUtc = createdAtUtc;
        LatestVersionNumber = 1;
    }

    public void UpdateDraft(Guid draftVersionId, DateTime updatedAtUtc)
    {
        CurrentDraftVersionId = draftVersionId;
        UpdatedAtUtc = updatedAtUtc;
        if (Status == WorkflowStatus.Archived) Status = WorkflowStatus.Draft;
    }

    public void PublishVersion(Guid publishedVersionId, int versionNumber, DateTime publishedAtUtc)
    {
        PublishedVersionId = publishedVersionId;
        LatestVersionNumber = Math.Max(LatestVersionNumber, versionNumber);
        Status = WorkflowStatus.Published;
        UpdatedAtUtc = publishedAtUtc;
    }

    public void Archive(DateTime updatedAtUtc)
    {
        Status = WorkflowStatus.Archived;
        UpdatedAtUtc = updatedAtUtc;
    }
}
