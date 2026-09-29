using OpenFlow.Domain.Executions;

namespace OpenFlow.Application.Abstractions;

public interface IEffectDispatcher
{
    Task<string> DispatchAsync(EffectIntent intent, CancellationToken cancellationToken = default);
}
