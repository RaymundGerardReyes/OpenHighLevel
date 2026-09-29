using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Executions;

public class WaitState : ValueObject
{
    public DateTime DueAtUtc { get; }
    public string Reason { get; }
    public Guid? ScheduledTaskId { get; }

    public WaitState(DateTime dueAtUtc, string reason, Guid? scheduledTaskId = null)
    {
        DueAtUtc = dueAtUtc;
        Reason = reason;
        ScheduledTaskId = scheduledTaskId;
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return DueAtUtc;
        yield return Reason;
        yield return ScheduledTaskId;
    }
}
