namespace OpenFlow.Domain.Executions;

public enum ExecutionStatus
{
    Pending = 1,
    Running = 2,
    Waiting = 3,
    Completed = 4,
    Failed = 5,
    Cancelled = 6,
    Skipped = 7
}
