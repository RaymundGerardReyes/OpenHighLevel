using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.SimulationRuns;

namespace OpenFlow.Application.SimulationRuns.Queries.GetSimulationRun;

public record GetSimulationRunQuery(Guid SimulationRunId) : IQuery<ApiResponse<SimulationResultDto>>;
