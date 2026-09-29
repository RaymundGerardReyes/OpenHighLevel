using OpenFlow.Application.Abstractions;
using OpenFlow.Application.SimulationRuns.Services;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.SimulationRuns;

namespace OpenFlow.Application.SimulationRuns.Queries.GetSimulationRun;

public class GetSimulationRunHandler : IQueryHandler<GetSimulationRunQuery, ApiResponse<SimulationResultDto>>
{
    private readonly ISimulationEngine _simulationEngine;

    public GetSimulationRunHandler(ISimulationEngine simulationEngine) => _simulationEngine = simulationEngine;

    public async Task<ApiResponse<SimulationResultDto>> HandleAsync(GetSimulationRunQuery query, CancellationToken ct = default)
    {
        if (query.SimulationRunId == Guid.Empty)
            return ApiResponse<SimulationResultDto>.Fail("SimulationRunId is required.");

        var result = await _simulationEngine.GetSimulationResultAsync(query.SimulationRunId, ct);
        return result.IsSuccess
            ? ApiResponse<SimulationResultDto>.Ok(result.Value!)
            : ApiResponse<SimulationResultDto>.Fail(result.Error);
    }
}
