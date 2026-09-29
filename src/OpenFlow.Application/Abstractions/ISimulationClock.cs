namespace OpenFlow.Application.Abstractions;

public interface ISimulationClock
{
    DateTime UtcNow { get; }
    void AdvanceBy(TimeSpan duration);
    void SetTime(DateTime utcTime);
}
