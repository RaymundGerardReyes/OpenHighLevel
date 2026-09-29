using OpenFlow.Domain.Common;

namespace OpenFlow.Application.Executions.Commands.RetryExecutionStep;

public class RetryExecutionStepValidator
{
    public Result Validate(RetryExecutionStepCommand command)
    {
        if (command.ExecutionId == Guid.Empty) return Result.Failure("ExecutionId is required.");
        if (string.IsNullOrWhiteSpace(command.NodeKey)) return Result.Failure("NodeKey is required.");
        return Result.Success();
    }
}
