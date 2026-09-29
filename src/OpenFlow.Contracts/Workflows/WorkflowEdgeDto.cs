namespace OpenFlow.Contracts.Workflows;

public class WorkflowEdgeDto
{
    public string SourceNodeKey { get; set; } = string.Empty;
    public string SourcePort { get; set; } = "default";
    public string TargetNodeKey { get; set; } = string.Empty;
    public int Priority { get; set; }
}
