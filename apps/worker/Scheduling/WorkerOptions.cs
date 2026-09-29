namespace OpenFlow.Worker.Scheduling;

public class WorkerOptions
{
    public int PollingIntervalMs { get; set; } = 2000;
    public int BatchSize { get; set; } = 10;
    public int LeaseDurationSeconds { get; set; } = 30;
}
