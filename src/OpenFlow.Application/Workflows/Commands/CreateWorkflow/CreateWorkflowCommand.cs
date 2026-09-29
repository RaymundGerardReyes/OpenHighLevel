using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Workflows;

namespace OpenFlow.Application.Workflows.Commands.CreateWorkflow;

public record CreateWorkflowCommand(string Name, string Description) : ICommand<ApiResponse<CreateWorkflowResponse>>;
