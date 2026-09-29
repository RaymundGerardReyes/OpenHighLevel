using OpenFlow.Application.Abstractions;

namespace OpenFlow.Infrastructure.Clock;

public class SystemClock : ISimulationClock
{
    public DateTime UtcNow => DateTime.UtcNow;
    public void AdvanceBy(TimeSpan duration) { /* System clock advances naturally */ }
    public void SetTime(DateTime utcTime) { /* System clock cannot be set manually */ }
}
