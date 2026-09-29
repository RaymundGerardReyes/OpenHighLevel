using OpenFlow.Domain.Common;

namespace OpenFlow.Application.Executions.Commands.CancelExecution;

public class CancelExecutionValidator
{
    public Result Validate(CancelExecutionCommand command)
    {
        if (command.ExecutionId == Guid.Empty) return Result.Failure("ExecutionId is required.");
        return Result.Success();
    }
}
