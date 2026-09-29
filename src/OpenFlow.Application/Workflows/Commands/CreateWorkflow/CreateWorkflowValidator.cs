using OpenFlow.Domain.Common;

namespace OpenFlow.Application.Workflows.Commands.CreateWorkflow;

public class CreateWorkflowValidator
{
    public Result Validate(CreateWorkflowCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.Name))
            return Result.Failure("Workflow name is required.");
        if (command.Name.Length > 100)
            return Result.Failure("Workflow name cannot exceed 100 characters.");
        return Result.Success();
    }
}
