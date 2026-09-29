using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Workflows;

namespace OpenFlow.Application.Workflows.Commands.PublishWorkflowVersion;

public record PublishWorkflowVersionCommand(Guid WorkflowId) : ICommand<ApiResponse<PublishWorkflowResponse>>;
