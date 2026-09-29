using OpenFlow.Application.Abstractions;
using OpenFlow.Domain.Executions;

namespace OpenFlow.Infrastructure.Effects;

public class MockEffectDispatcher : IEffectDispatcher
{
    private readonly IFixtureRegistry _fixtureRegistry;

    public MockEffectDispatcher(IFixtureRegistry? fixtureRegistry = null)
    {
        _fixtureRegistry = fixtureRegistry ?? new FixtureRegistry();
    }

    public Task<string> DispatchAsync(EffectIntent intent, CancellationToken cancellationToken = default)
    {
        var response = _fixtureRegistry.MatchResponse(intent)
            ?? "{\"status\":\"delivered\",\"simulated\":true}";

        intent.MarkExecuted(response);
        return Task.FromResult(response);
    }
}
