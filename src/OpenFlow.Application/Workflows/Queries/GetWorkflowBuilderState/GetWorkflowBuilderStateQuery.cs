using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Workflows;

namespace OpenFlow.Application.Workflows.Queries.GetWorkflowBuilderState;

public record GetWorkflowBuilderStateQuery(Guid WorkflowId) : IQuery<ApiResponse<WorkflowGraphDto>>;
