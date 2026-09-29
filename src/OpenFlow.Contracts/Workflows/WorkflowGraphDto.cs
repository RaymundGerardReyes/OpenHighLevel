namespace OpenFlow.Contracts.Workflows;

public class WorkflowGraphDto
{
    public List<WorkflowNodeDto> Nodes { get; set; } = new();
    public List<WorkflowEdgeDto> Edges { get; set; } = new();
}
