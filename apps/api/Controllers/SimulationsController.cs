using Microsoft.AspNetCore.Mvc;
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
