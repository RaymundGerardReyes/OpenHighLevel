using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Workflows;

public class WorkflowNode : Entity<Guid>
{
    public Guid WorkflowVersionId { get; private set; }
    public string NodeKey { get; private set; } = string.Empty;
    public NodeType Type { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string ConfigurationJson { get; private set; } = "{}";
    public double PositionX { get; private set; }
    public double PositionY { get; private set; }

    private WorkflowNode() { }

    public WorkflowNode(Guid id, Guid workflowVersionId, string nodeKey, NodeType type, string name, string configJson, double x = 0, double y = 0)
        : base(id)
    {
        WorkflowVersionId = workflowVersionId;
        NodeKey = nodeKey;
        Type = type;
        Name = name;
        ConfigurationJson = configJson;
        PositionX = x;
        PositionY = y;
    }
}
