namespace OpenFlow.Contracts.SimulationRuns;

public class StartSimulationRequest
{
    public Guid WorkflowVersionId { get; set; }
    public string Mode { get; set; } = "FastSimulation";
    public string InitialStateJson { get; set; } = "{}";
    public string? SubjectId { get; set; }
    public string ContactEmail { get; set; } = string.Empty;
    public int MaxVirtualDays { get; set; } = 30;
    public List<SimulationFixtureDto> Fixtures { get; set; } = new();
}
