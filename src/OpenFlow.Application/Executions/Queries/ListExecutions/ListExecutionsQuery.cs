using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Executions;

namespace OpenFlow.Application.Executions.Queries.ListExecutions;

public record ListExecutionsQuery(int Page = 1, int PageSize = 20) : IQuery<ApiResponse<PagedList<ExecutionTraceDto>>>;
