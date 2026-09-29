using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Executions;

namespace OpenFlow.Application.Executions.Queries.GetExecutionStep;

public record GetExecutionStepQuery(Guid StepId) : IQuery<ApiResponse<ExecutionStepDto>>;
