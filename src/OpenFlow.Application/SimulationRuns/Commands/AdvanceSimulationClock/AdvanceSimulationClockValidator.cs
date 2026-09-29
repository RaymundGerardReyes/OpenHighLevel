using OpenFlow.Domain.Common;

namespace OpenFlow.Application.SimulationRuns.Commands.AdvanceSimulationClock;

public class AdvanceSimulationClockValidator
{
    public Result Validate(AdvanceSimulationClockCommand command)
    {
        if (command.SimulationRunId == Guid.Empty) return Result.Failure("SimulationRunId is required.");
        return Result.Success();
    }
}
