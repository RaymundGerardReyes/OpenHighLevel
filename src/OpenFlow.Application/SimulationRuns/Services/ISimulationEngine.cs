using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.SimulationRuns;
using OpenFlow.Domain.Common;

namespace OpenFlow.Application.SimulationRuns.Services;

public interface ISimulationEngine
{
    Task<Result<SimulationResultDto>> StartSimulationAsync(StartSimulationRequest request, CancellationToken ct = default);
    Task<Result<SimulationResultDto>> AdvanceClockAsync(Guid simulationRunId, int? minutes, bool advanceToNextTask, CancellationToken ct = default);
    Task<Result<SimulationResultDto>> GetSimulationResultAsync(Guid simulationRunId, CancellationToken ct = default);
}
