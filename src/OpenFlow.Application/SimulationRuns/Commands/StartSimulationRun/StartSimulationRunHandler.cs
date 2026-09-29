using OpenFlow.Application.Abstractions;
using OpenFlow.Application.SimulationRuns.Services;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.SimulationRuns;

namespace OpenFlow.Application.SimulationRuns.Commands.StartSimulationRun;

public class StartSimulationRunHandler : ICommandHandler<StartSimulationRunCommand, ApiResponse<SimulationResultDto>>
{
    private readonly ISimulationEngine _simulationEngine;
    private readonly StartSimulationRunValidator _validator;

    public StartSimulationRunHandler(ISimulationEngine simulationEngine, StartSimulationRunValidator? validator = null)
    {
        _simulationEngine = simulationEngine;
        _validator = validator ?? new StartSimulationRunValidator();
    }

    public async Task<ApiResponse<SimulationResultDto>> HandleAsync(StartSimulationRunCommand command, CancellationToken ct = default)
    {
        var validation = _validator.Validate(command);
        if (validation.IsFailure) return ApiResponse<SimulationResultDto>.Fail(validation.Error);

        var result = await _simulationEngine.StartSimulationAsync(command.Request, ct);
        return result.IsSuccess
            ? ApiResponse<SimulationResultDto>.Ok(result.Value!)
            : ApiResponse<SimulationResultDto>.Fail(result.Error);
    }
}
