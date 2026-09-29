namespace OpenFlow.Contracts.SimulationRuns;

public class AdvanceSimulationClockRequest
{
    public int? Minutes { get; set; }
    public bool AdvanceToNextTask { get; set; } = true;
    public string? ResumptionContextJson { get; set; }
}
