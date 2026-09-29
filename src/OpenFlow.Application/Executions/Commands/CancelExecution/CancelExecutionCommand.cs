using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;

namespace OpenFlow.Application.Executions.Commands.CancelExecution;

public record CancelExecutionCommand(Guid ExecutionId) : ICommand<ApiResponse<bool>>;
