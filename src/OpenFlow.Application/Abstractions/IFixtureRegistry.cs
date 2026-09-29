using OpenFlow.Contracts.SimulationRuns;
using OpenFlow.Domain.Executions;

namespace OpenFlow.Application.Abstractions;

public interface IFixtureRegistry
{
    void RegisterFixture(SimulationFixtureDto fixture);
    void RegisterFixtures(IEnumerable<SimulationFixtureDto> fixtures);
    string? MatchResponse(EffectIntent intent);
    void Clear();
}
