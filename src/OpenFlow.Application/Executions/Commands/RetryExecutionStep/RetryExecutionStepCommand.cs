using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;

namespace OpenFlow.Application.Executions.Commands.RetryExecutionStep;

public record RetryExecutionStepCommand(Guid ExecutionId, string NodeKey) : ICommand<ApiResponse<bool>>;
