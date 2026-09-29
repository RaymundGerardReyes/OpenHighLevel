using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Executions;

public class EffectIntent : Entity<Guid>
{
    public Guid ExecutionStepId { get; private set; }
    public string IdempotencyKey { get; private set; } = string.Empty;
    public string Type { get; private set; } = string.Empty;
    public string RequestJson { get; private set; } = "{}";
    public string? FixtureResponseJson { get; private set; }
    public string Status { get; private set; } = "Pending";
    public DateTime CreatedAtUtc { get; private set; }

    private EffectIntent() { }

    public EffectIntent(Guid id, Guid executionStepId, string idempotencyKey, string type, string requestJson, DateTime createdAtUtc, string? fixtureResponseJson = null)
        : base(id)
    {
        ExecutionStepId = executionStepId;
        IdempotencyKey = idempotencyKey;
        Type = type;
        RequestJson = requestJson;
        CreatedAtUtc = createdAtUtc;
        FixtureResponseJson = fixtureResponseJson;
    }

    public void MarkExecuted(string? responseJson = null)
    {
        Status = "Executed";
        if (responseJson != null) FixtureResponseJson = responseJson;
    }
}
