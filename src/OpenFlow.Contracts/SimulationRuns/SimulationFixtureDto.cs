namespace OpenFlow.Contracts.SimulationRuns;

public class SimulationFixtureDto
{
    public string? Key { get; set; }
    public string Type { get; set; } = "Webhook";
    public int StatusCode { get; set; } = 200;
    public string ResponseBodyJson { get; set; } = "{\"status\":\"ok\"}";
    public int SimulatedLatencyMs { get; set; } = 0;
}
