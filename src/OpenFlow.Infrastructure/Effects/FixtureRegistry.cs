using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.SimulationRuns;
using OpenFlow.Domain.Executions;

namespace OpenFlow.Infrastructure.Effects;

public class FixtureRegistry : IFixtureRegistry
{
    private readonly List<SimulationFixtureDto> _fixtures = new();
    private readonly object _lock = new();

    public void RegisterFixture(SimulationFixtureDto fixture)
    {
        lock (_lock)
        {
            _fixtures.Add(fixture);
        }
    }

    public void RegisterFixtures(IEnumerable<SimulationFixtureDto> fixtures)
    {
        lock (_lock)
        {
            _fixtures.AddRange(fixtures);
        }
    }

    public string? MatchResponse(EffectIntent intent)
    {
        lock (_lock)
        {
            // 1. Try to match by Key (node key or url substring)
            if (!string.IsNullOrWhiteSpace(intent.RequestJson))
            {
                var matchedByKey = _fixtures.FirstOrDefault(f =>
                    !string.IsNullOrWhiteSpace(f.Key) &&
                    (intent.IdempotencyKey.Contains(f.Key, StringComparison.OrdinalIgnoreCase) ||
                     intent.RequestJson.Contains(f.Key, StringComparison.OrdinalIgnoreCase)));

                if (matchedByKey != null)
                {
                    return matchedByKey.ResponseBodyJson;
                }
            }

            // 2. Fall back to match by Type
            var matchedByType = _fixtures.FirstOrDefault(f =>
                f.Type.Equals(intent.Type, StringComparison.OrdinalIgnoreCase));

            return matchedByType?.ResponseBodyJson;
        }
    }

    public void Clear()
    {
        lock (_lock)
        {
            _fixtures.Clear();
        }
    }
}
