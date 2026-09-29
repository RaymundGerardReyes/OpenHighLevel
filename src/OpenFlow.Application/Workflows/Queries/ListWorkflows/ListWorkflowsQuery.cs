using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Workflows;

namespace OpenFlow.Application.Workflows.Queries.ListWorkflows;

public record ListWorkflowsQuery(int Page = 1, int PageSize = 20) : IQuery<ApiResponse<PagedList<WorkflowDto>>>;
