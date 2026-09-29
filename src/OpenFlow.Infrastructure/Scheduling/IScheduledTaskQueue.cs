using OpenFlow.Domain.Scheduling;

namespace OpenFlow.Infrastructure.Scheduling;

public interface IScheduledTaskQueue
{
    Task<List<ScheduledTask>> ClaimDueTasksAsync(string workerId, int batchSize, TimeSpan leaseDuration, CancellationToken ct = default);
    Task CompleteTaskAsync(Guid taskId, CancellationToken ct = default);
    Task ReleaseLeaseAsync(Guid taskId, CancellationToken ct = default);
}
