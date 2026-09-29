using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;

namespace OpenFlow.Application.Workflows.Commands.ArchiveWorkflow;

public record ArchiveWorkflowCommand(Guid WorkflowId) : ICommand<ApiResponse<bool>>;
