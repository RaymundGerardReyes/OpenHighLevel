namespace OpenFlow.Domain.Scheduling;

public enum TaskStatus
{
    Pending = 1,
    Claimed = 2,
    Completed = 3,
    Failed = 4,
    Cancelled = 5
}
