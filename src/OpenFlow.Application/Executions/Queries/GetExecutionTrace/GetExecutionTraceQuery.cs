using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Executions;

namespace OpenFlow.Application.Executions.Queries.GetExecutionTrace;

public record GetExecutionTraceQuery(Guid ExecutionId) : IQuery<ApiResponse<ExecutionTraceDto>>;
