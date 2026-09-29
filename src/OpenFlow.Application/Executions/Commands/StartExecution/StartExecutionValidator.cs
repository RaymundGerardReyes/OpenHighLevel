using OpenFlow.Domain.Common;

namespace OpenFlow.Application.Executions.Commands.StartExecution;

public class StartExecutionValidator
{
    public Result Validate(StartExecutionCommand command)
    {
        if (command.WorkflowVersionId == Guid.Empty)
            return Result.Failure("WorkflowVersionId is required to start an execution.");
        return Result.Success();
    }
}
