using OpenFlow.Application.Abstractions;

namespace OpenFlow.Infrastructure.Clock;

public class VirtualSimulationClock : ISimulationClock
{
    private DateTime _currentUtc;

    public DateTime UtcNow => _currentUtc;

    public VirtualSimulationClock(DateTime startUtc) => _currentUtc = startUtc;

    public void AdvanceBy(TimeSpan duration) => _currentUtc = _currentUtc.Add(duration);
    public void SetTime(DateTime utcTime) => _currentUtc = utcTime;
}
