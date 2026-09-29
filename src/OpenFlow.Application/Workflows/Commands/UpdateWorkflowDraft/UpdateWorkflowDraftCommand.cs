using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Workflows;

namespace OpenFlow.Application.Workflows.Commands.UpdateWorkflowDraft;

public record UpdateWorkflowDraftCommand(Guid WorkflowId, WorkflowGraphDto Graph) : ICommand<ApiResponse<bool>>;
