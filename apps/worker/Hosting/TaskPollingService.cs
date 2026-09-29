using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenFlow.Application.Executions.Services;
using OpenFlow.Infrastructure.Scheduling;
using OpenFlow.Worker.Scheduling;

namespace OpenFlow.Worker.Hosting;

/// <summary>
/// Hosted background worker orchestrating scheduled task polling, lease acquisition, and execution resumption.
/// </summary>
public class TaskPollingService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TaskPollingService> _logger;
    private readonly WorkerOptions _options;
    private readonly string _workerId = $"worker-{Guid.NewGuid():N}";

    public TaskPollingService(IServiceProvider serviceProvider, ILogger<TaskPollingService> logger, IOptions<WorkerOptions> options)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _options = options.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OpenFlow Task Polling Service started. Worker ID: {WorkerId}", _workerId);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = _serviceProvider.CreateAsyncScope();
                var queue = scope.ServiceProvider.GetRequiredService<IScheduledTaskQueue>();
                var engine = scope.ServiceProvider.GetRequiredService<IWorkflowExecutionEngine>();

                var tasks = await queue.ClaimDueTasksAsync(_workerId, _options.BatchSize, TimeSpan.FromSeconds(_options.LeaseDurationSeconds), stoppingToken);

                foreach (var task in tasks)
                {
                    _logger.LogInformation("Resuming execution {ExecutionId} on node {NodeKey}", task.ExecutionId, task.NodeKey);
                    var result = await engine.ResumeExecutionAsync(task.ExecutionId, task.NodeKey, "{}", stoppingToken);

                    if (result.IsSuccess)
                    {
                        await queue.CompleteTaskAsync(task.Id, stoppingToken);
                    }
                    else
                    {
                        _logger.LogWarning("Task execution failed: {Error}. Releasing lease.", result.Error);
                        await queue.ReleaseLeaseAsync(task.Id, stoppingToken);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during task polling cycle.");
            }

            await Task.Delay(_options.PollingIntervalMs, stoppingToken);
        }
    }
}
