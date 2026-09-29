using OpenFlow.Domain.Common;
using OpenFlow.Application.Workflows.Validators;

namespace OpenFlow.Application.Workflows.Commands.UpdateWorkflowDraft;

public class UpdateWorkflowDraftValidator
{
    private readonly WorkflowGraphDtoValidator _graphValidator = new();

    public Result Validate(UpdateWorkflowDraftCommand command)
    {
        if (command.WorkflowId == Guid.Empty)
            return Result.Failure("Valid WorkflowId is required.");
        return _graphValidator.Validate(command.Graph);
    }
}
