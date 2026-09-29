using OpenFlow.Domain.Common;

namespace OpenFlow.Application.Workflows.Commands.ArchiveWorkflow;

public class ArchiveWorkflowValidator
{
    public Result Validate(ArchiveWorkflowCommand command)
    {
        if (command.WorkflowId == Guid.Empty)
            return Result.Failure("Valid WorkflowId is required.");
        return Result.Success();
    }
}
