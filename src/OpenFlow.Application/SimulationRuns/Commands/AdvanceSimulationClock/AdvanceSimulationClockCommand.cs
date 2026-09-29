using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.SimulationRuns;

namespace OpenFlow.Application.SimulationRuns.Commands.AdvanceSimulationClock;

public record AdvanceSimulationClockCommand(
    Guid SimulationRunId,
    int? Minutes,
    bool AdvanceToNextTask = true
) : ICommand<ApiResponse<SimulationResultDto>>;
