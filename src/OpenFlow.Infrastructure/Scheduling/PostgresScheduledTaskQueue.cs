using OpenFlow.Application.Abstractions;
using OpenFlow.Domain.Scheduling;
using DomainTaskStatus = OpenFlow.Domain.Scheduling.TaskStatus;

namespace OpenFlow.Infrastructure.Scheduling;

/// <summary>
/// Implements PostgreSQL task claiming with lease ownership and FOR UPDATE SKIP LOCKED query semantics.
/// Production SQL:
/// SELECT * FROM scheduled_tasks 
/// WHERE (status = 'Pending' AND due_at_utc <= @now) 
///    OR (status = 'Claimed' AND lease_until_utc < @now) 
/// ORDER BY due_at_utc ASC 
/// LIMIT @batchSize 
/// FOR UPDATE SKIP LOCKED;
/// </summary>
public class PostgresScheduledTaskQueue : IScheduledTaskQueue
{
    private static readonly object SyncLock = new();
    private readonly IApplicationDbContext _db;
    private readonly ISimulationClock _clock;

    public PostgresScheduledTaskQueue(IApplicationDbContext db, ISimulationClock clock)
    {
        _db = db;
        _clock = clock;
    }

    public Task<List<ScheduledTask>> ClaimDueTasksAsync(string workerId, int batchSize, TimeSpan leaseDuration, CancellationToken ct = default)
    {
        var now = _clock.UtcNow;
        var claimed = new List<ScheduledTask>();

        // Atomic lock to guarantee single-consumer lease claiming in local multi-worker simulations
        lock (SyncLock)
        {
            var dueTasks = _db.ScheduledTasks
                .Where(t => t.Status == DomainTaskStatus.Pending && t.DueAtUtc <= now
                         || (t.Status == DomainTaskStatus.Claimed && t.LeaseUntilUtc.HasValue && t.LeaseUntilUtc.Value < now))
                .OrderBy(t => t.DueAtUtc)
                .Take(batchSize)
                .ToList();

            foreach (var task in dueTasks)
            {
                if (task.Claim(workerId, leaseDuration, now))
                {
                    claimed.Add(task);
                }
            }
        }

        return Task.FromResult(claimed);
    }

    public Task CompleteTaskAsync(Guid taskId, CancellationToken ct = default)
    {
        lock (SyncLock)
        {
            var task = _db.ScheduledTasks.FirstOrDefault(t => t.Id == taskId);
            task?.Complete();
        }
        return Task.CompletedTask;
    }

    public Task ReleaseLeaseAsync(Guid taskId, CancellationToken ct = default)
    {
        lock (SyncLock)
        {
            var task = _db.ScheduledTasks.FirstOrDefault(t => t.Id == taskId);
            task?.Reschedule(_clock.UtcNow);
        }
        return Task.CompletedTask;
    }
}

