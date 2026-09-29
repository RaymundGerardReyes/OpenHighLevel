using Microsoft.AspNetCore.Mvc;
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
