namespace OpenFlow.Contracts.Workflows;

public class WorkflowNodeDto
{
    public string NodeKey { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ConfigJson { get; set; } = "{}";
    public double PositionX { get; set; }
    public double PositionY { get; set; }
}
