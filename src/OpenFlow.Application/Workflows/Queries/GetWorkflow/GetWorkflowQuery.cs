using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Workflows;

namespace OpenFlow.Application.Workflows.Queries.GetWorkflow;

public record GetWorkflowQuery(Guid WorkflowId) : IQuery<ApiResponse<WorkflowDto>>;
