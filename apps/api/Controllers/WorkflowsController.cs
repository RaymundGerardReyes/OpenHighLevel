using Microsoft.AspNetCore.Mvc;
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
