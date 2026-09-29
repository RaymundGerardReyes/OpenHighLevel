using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Audit;

public class AuditLog : Entity<Guid>
{
    public string ActorId { get; private set; } = string.Empty;
    public string Action { get; private set; } = string.Empty;
    public string TargetType { get; private set; } = string.Empty;
    public string TargetId { get; private set; } = string.Empty;
    public string ChangesJson { get; private set; } = "{}";
    public DateTime TimestampUtc { get; private set; }

    private AuditLog() { }

    public AuditLog(Guid id, string actorId, string action, string targetType, string targetId, string changesJson, DateTime timestampUtc)
        : base(id)
    {
        ActorId = actorId;
        Action = action;
        TargetType = targetType;
        TargetId = targetId;
        ChangesJson = changesJson;
        TimestampUtc = timestampUtc;
    }
}
