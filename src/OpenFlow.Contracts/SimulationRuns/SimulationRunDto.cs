namespace OpenFlow.Contracts.SimulationRuns;

public class SimulationRunDto
{
    public Guid Id { get; set; }
    public Guid WorkflowVersionId { get; set; }
    public string Mode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime ClockStartUtc { get; set; }
    public DateTime CurrentClockUtc { get; set; }
    public string FinalStateJson { get; set; } = "{}";
}
