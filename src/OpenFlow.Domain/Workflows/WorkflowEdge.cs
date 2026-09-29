using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Workflows;

public class WorkflowEdge : Entity<Guid>
{
    public Guid WorkflowVersionId { get; private set; }
    public string SourceNodeKey { get; private set; } = string.Empty;
    public string SourcePort { get; private set; } = NodePort.Default;
    public string TargetNodeKey { get; private set; } = string.Empty;
    public int Priority { get; private set; }

    private WorkflowEdge() { }

    public WorkflowEdge(Guid id, Guid workflowVersionId, string sourceNodeKey, string sourcePort, string targetNodeKey, int priority = 0)
        : base(id)
    {
        WorkflowVersionId = workflowVersionId;
        SourceNodeKey = sourceNodeKey;
        SourcePort = sourcePort;
        TargetNodeKey = targetNodeKey;
        Priority = priority;
    }
}
