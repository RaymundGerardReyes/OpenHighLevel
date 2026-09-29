using OpenFlow.Domain.Common;

namespace OpenFlow.Application.Workflows.Commands.PublishWorkflowVersion;

public class PublishWorkflowVersionValidator
{
    public Result Validate(PublishWorkflowVersionCommand command)
    {
        if (command.WorkflowId == Guid.Empty)
            return Result.Failure("Valid WorkflowId is required.");
        return Result.Success();
    }
}
