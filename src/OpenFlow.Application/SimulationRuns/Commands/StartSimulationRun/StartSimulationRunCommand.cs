using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.SimulationRuns;

namespace OpenFlow.Application.SimulationRuns.Commands.StartSimulationRun;

public record StartSimulationRunCommand(StartSimulationRequest Request) : ICommand<ApiResponse<SimulationResultDto>>;
