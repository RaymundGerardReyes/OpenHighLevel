// api-worker-templates.js
// Host applications: Web API and Background Worker

export const apiWorkerTemplates = {
  'apps/api/Program.cs': `using OpenFlow.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddOpenFlowInfrastructure();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.Run();
`,

  'apps/api/appsettings.json': `{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=openflow;Username=openflow;Password=openflow_dev_password"
  }
}`,

  'apps/api/appsettings.Development.json': `{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information"
    }
  }
}`,

  'apps/api/Controllers/WorkflowsController.cs': `using Microsoft.AspNetCore.Mvc;
using OpenFlow.Application.Abstractions;
using OpenFlow.Application.Workflows.Commands.ArchiveWorkflow;
using OpenFlow.Application.Workflows.Commands.CreateWorkflow;
using OpenFlow.Application.Workflows.Commands.PublishWorkflowVersion;
using OpenFlow.Application.Workflows.Commands.UpdateWorkflowDraft;
using OpenFlow.Application.Workflows.Queries.GetWorkflow;
using OpenFlow.Application.Workflows.Queries.GetWorkflowBuilderState;
using OpenFlow.Application.Workflows.Queries.ListWorkflows;
using OpenFlow.Application.Workflows.Services;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Workflows;

namespace OpenFlow.Api.Controllers;

[ApiController]
[Route("api/v1/workflows")]
public class WorkflowsController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    private readonly IWorkflowGraphValidationService _validationService;
    private readonly ISimulationClock _clock;

    public WorkflowsController(IApplicationDbContext db, IWorkflowGraphValidationService validationService, ISimulationClock clock)
    {
        _db = db;
        _validationService = validationService;
        _clock = clock;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedList<WorkflowDto>>>> List([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var handler = new ListWorkflowsHandler(_db);
        var result = await handler.HandleAsync(new ListWorkflowsQuery(page, pageSize));
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<WorkflowDto>>> GetById(Guid id)
    {
        var handler = new GetWorkflowHandler(_db);
        var result = await handler.HandleAsync(new GetWorkflowQuery(id));
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<CreateWorkflowResponse>>> Create([FromBody] CreateWorkflowRequest request)
    {
        var handler = new CreateWorkflowHandler(_db, _clock);
        var result = await handler.HandleAsync(new CreateWorkflowCommand(request.Name, request.Description));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("{id:guid}/draft")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateDraft(Guid id, [FromBody] WorkflowGraphDto graph)
    {
        var handler = new UpdateWorkflowDraftHandler(_db, _clock);
        var result = await handler.HandleAsync(new UpdateWorkflowDraftCommand(id, graph));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("{id:guid}/publish")]
    public async Task<ActionResult<ApiResponse<PublishWorkflowResponse>>> Publish(Guid id)
    {
        var handler = new PublishWorkflowVersionHandler(_db, _validationService, _clock);
        var result = await handler.HandleAsync(new PublishWorkflowVersionCommand(id));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<ActionResult<ApiResponse<bool>>> Archive(Guid id)
    {
        var handler = new ArchiveWorkflowHandler(_db, _clock);
        var result = await handler.HandleAsync(new ArchiveWorkflowCommand(id));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{id:guid}/builder-state")]
    public async Task<ActionResult<ApiResponse<WorkflowGraphDto>>> GetBuilderState(Guid id)
    {
        var handler = new GetWorkflowBuilderStateHandler(_db);
        var result = await handler.HandleAsync(new GetWorkflowBuilderStateQuery(id));
        return Ok(result);
    }
}
`,

  'apps/api/Controllers/ExecutionsController.cs': `using Microsoft.AspNetCore.Mvc;
using OpenFlow.Application.Abstractions;
using OpenFlow.Application.Executions.Commands.CancelExecution;
using OpenFlow.Application.Executions.Commands.ResumeExecution;
using OpenFlow.Application.Executions.Commands.StartExecution;
using OpenFlow.Application.Executions.Queries.GetExecutionTrace;
using OpenFlow.Application.Executions.Queries.ListExecutions;
using OpenFlow.Application.Executions.Services;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Executions;

namespace OpenFlow.Api.Controllers;

[ApiController]
[Route("api/v1/executions")]
public class ExecutionsController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    private readonly IWorkflowExecutionEngine _engine;
    private readonly ISimulationClock _clock;

    public ExecutionsController(IApplicationDbContext db, IWorkflowExecutionEngine engine, ISimulationClock clock)
    {
        _db = db;
        _engine = engine;
        _clock = clock;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedList<ExecutionTraceDto>>>> List([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var handler = new ListExecutionsHandler(_db);
        var result = await handler.HandleAsync(new ListExecutionsQuery(page, pageSize));
        return Ok(result);
    }

    [HttpGet("{id:guid}/trace")]
    public async Task<ActionResult<ApiResponse<ExecutionTraceDto>>> GetTrace(Guid id)
    {
        var handler = new GetExecutionTraceHandler(_db);
        var result = await handler.HandleAsync(new GetExecutionTraceQuery(id));
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<StartExecutionResponse>>> Start([FromBody] StartExecutionRequest request)
    {
        var handler = new StartExecutionHandler(_engine);
        var result = await handler.HandleAsync(new StartExecutionCommand(request.WorkflowVersionId, request.SimulationRunId, request.SubjectId, request.InitialContextJson));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("{id:guid}/resume")]
    public async Task<ActionResult<ApiResponse<bool>>> Resume(Guid id, [FromBody] ResumeExecutionRequest request)
    {
        var handler = new ResumeExecutionHandler(_engine);
        var result = await handler.HandleAsync(new ResumeExecutionCommand(id, request.NodeKey, request.ContextJson));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<ApiResponse<bool>>> Cancel(Guid id)
    {
        var handler = new CancelExecutionHandler(_db, _clock);
        var result = await handler.HandleAsync(new CancelExecutionCommand(id));
        return Ok(result);
    }
}
`,

  'apps/api/Controllers/SimulationsController.cs': `using Microsoft.AspNetCore.Mvc;
using OpenFlow.Application.SimulationRuns.Commands.AdvanceSimulationClock;
using OpenFlow.Application.SimulationRuns.Commands.StartSimulationRun;
using OpenFlow.Application.SimulationRuns.Queries.GetSimulationRun;
using OpenFlow.Application.SimulationRuns.Services;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.SimulationRuns;

namespace OpenFlow.Api.Controllers;

[ApiController]
[Route("api/v1/simulations")]
public class SimulationsController : ControllerBase
{
    private readonly ISimulationEngine _simulationEngine;

    public SimulationsController(ISimulationEngine simulationEngine)
    {
        _simulationEngine = simulationEngine;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<SimulationResultDto>>> StartSimulation([FromBody] StartSimulationRequest request)
    {
        var handler = new StartSimulationRunHandler(_simulationEngine);
        var result = await handler.HandleAsync(new StartSimulationRunCommand(request));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("{id:guid}/advance-clock")]
    public async Task<ActionResult<ApiResponse<SimulationResultDto>>> AdvanceClock(Guid id, [FromBody] AdvanceSimulationClockRequest? request, [FromQuery] int? minutes = null)
    {
        int? effectiveMinutes = request?.Minutes ?? minutes;
        bool advanceToNextTask = request?.AdvanceToNextTask ?? (effectiveMinutes == null);

        var handler = new AdvanceSimulationClockHandler(_simulationEngine);
        var result = await handler.HandleAsync(new AdvanceSimulationClockCommand(id, effectiveMinutes, advanceToNextTask));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<SimulationResultDto>>> GetById(Guid id)
    {
        var handler = new GetSimulationRunHandler(_simulationEngine);
        var result = await handler.HandleAsync(new GetSimulationRunQuery(id));
        return result.Success ? Ok(result) : NotFound(result);
    }
}
`,

  'apps/worker/Program.cs': `using OpenFlow.Infrastructure;
using OpenFlow.Worker.Hosting;
using OpenFlow.Worker.Scheduling;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.Configure<WorkerOptions>(builder.Configuration.GetSection("Worker"));
builder.Services.AddOpenFlowInfrastructure();
builder.Services.AddHostedService<TaskPollingService>();

var host = builder.Build();
host.Run();
`,

  'apps/worker/appsettings.json': `{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.Hosting.Lifetime": "Information"
    }
  },
  "Worker": {
    "PollingIntervalMs": 2000,
    "BatchSize": 10,
    "LeaseDurationSeconds": 30
  }
}`,

  'apps/worker/Scheduling/WorkerOptions.cs': `namespace OpenFlow.Worker.Scheduling;

public class WorkerOptions
{
    public int PollingIntervalMs { get; set; } = 2000;
    public int BatchSize { get; set; } = 10;
    public int LeaseDurationSeconds { get; set; } = 30;
}
`,

  'apps/worker/Hosting/TaskPollingService.cs': `using Microsoft.Extensions.Hosting;
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
`,

};
