using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Scheduling;

public class ScheduledTask : AggregateRoot<Guid>
{
    public Guid ExecutionId { get; private set; }
    public string NodeKey { get; private set; } = string.Empty;
    public DateTime DueAtUtc { get; private set; }
    public TaskStatus Status { get; private set; } = TaskStatus.Pending;
    public string? LeaseOwner { get; private set; }
    public DateTime? LeaseUntilUtc { get; private set; }
    public int Attempts { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    private ScheduledTask() { }

    public ScheduledTask(Guid id, Guid executionId, string nodeKey, DateTime dueAtUtc, DateTime createdAtUtc)
        : base(id)
    {
        ExecutionId = executionId;
        NodeKey = nodeKey;
        DueAtUtc = dueAtUtc;
        CreatedAtUtc = createdAtUtc;
        Status = TaskStatus.Pending;
    }

    public bool Claim(string owner, TimeSpan duration, DateTime utcNow)
    {
        if (Status == TaskStatus.Completed || Status == TaskStatus.Cancelled) return false;
        if (Status == TaskStatus.Claimed && LeaseUntilUtc > utcNow && LeaseOwner != owner) return false;

        LeaseOwner = owner;
        LeaseUntilUtc = utcNow.Add(duration);
        Status = TaskStatus.Claimed;
        Attempts++;
        return true;
    }

    public void Complete() => Status = TaskStatus.Completed;
    public void Reschedule(DateTime nextDueAtUtc)
    {
        DueAtUtc = nextDueAtUtc;
        Status = TaskStatus.Pending;
        LeaseOwner = null;
        LeaseUntilUtc = null;
    }
}
