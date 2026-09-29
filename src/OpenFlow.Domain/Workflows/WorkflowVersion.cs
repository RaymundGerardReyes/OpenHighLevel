using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Workflows;

public class WorkflowVersion : Entity<Guid>
{
    public Guid WorkflowId { get; private set; }
    public int VersionNumber { get; private set; }
    public string DefinitionJson { get; private set; } = "{}";
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? PublishedAtUtc { get; private set; }

    private WorkflowVersion() { }

    public WorkflowVersion(Guid id, Guid workflowId, int versionNumber, string definitionJson, DateTime createdAtUtc, DateTime? publishedAtUtc = null)
        : base(id)
    {
        WorkflowId = workflowId;
        VersionNumber = versionNumber;
        DefinitionJson = definitionJson;
        CreatedAtUtc = createdAtUtc;
        PublishedAtUtc = publishedAtUtc;
    }
}
