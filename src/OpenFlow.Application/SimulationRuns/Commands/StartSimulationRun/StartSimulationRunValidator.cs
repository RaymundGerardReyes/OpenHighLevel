using OpenFlow.Domain.Common;

namespace OpenFlow.Application.SimulationRuns.Commands.StartSimulationRun;

public class StartSimulationRunValidator
{
    public Result Validate(StartSimulationRunCommand command)
    {
        if (command.Request == null) return Result.Failure("Request body cannot be null.");
        if (command.Request.WorkflowVersionId == Guid.Empty) return Result.Failure("WorkflowVersionId is required.");
        return Result.Success();
    }
}
