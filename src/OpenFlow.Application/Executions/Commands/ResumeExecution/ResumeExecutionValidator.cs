using OpenFlow.Domain.Common;

namespace OpenFlow.Application.Executions.Commands.ResumeExecution;

public class ResumeExecutionValidator
{
    public Result Validate(ResumeExecutionCommand command)
    {
        if (command.ExecutionId == Guid.Empty) return Result.Failure("ExecutionId is required.");
        if (string.IsNullOrWhiteSpace(command.NodeKey)) return Result.Failure("NodeKey is required to resume.");
        return Result.Success();
    }
}
