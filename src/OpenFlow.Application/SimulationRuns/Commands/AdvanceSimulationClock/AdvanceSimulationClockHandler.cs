using OpenFlow.Application.Abstractions;
using OpenFlow.Application.SimulationRuns.Services;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.SimulationRuns;

namespace OpenFlow.Application.SimulationRuns.Commands.AdvanceSimulationClock;

public class AdvanceSimulationClockHandler : ICommandHandler<AdvanceSimulationClockCommand, ApiResponse<SimulationResultDto>>
{
    private readonly ISimulationEngine _simulationEngine;
    private readonly AdvanceSimulationClockValidator _validator;

    public AdvanceSimulationClockHandler(ISimulationEngine simulationEngine, AdvanceSimulationClockValidator? validator = null)
    {
        _simulationEngine = simulationEngine;
        _validator = validator ?? new AdvanceSimulationClockValidator();
    }

    public async Task<ApiResponse<SimulationResultDto>> HandleAsync(AdvanceSimulationClockCommand command, CancellationToken ct = default)
    {
        var validation = _validator.Validate(command);
        if (validation.IsFailure) return ApiResponse<SimulationResultDto>.Fail(validation.Error);

        var result = await _simulationEngine.AdvanceClockAsync(command.SimulationRunId, command.Minutes, command.AdvanceToNextTask, ct);
        return result.IsSuccess
            ? ApiResponse<SimulationResultDto>.Ok(result.Value!)
            : ApiResponse<SimulationResultDto>.Fail(result.Error);
    }
}
