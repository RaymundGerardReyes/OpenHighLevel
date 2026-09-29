using OpenFlow.Application.Abstractions;
using OpenFlow.Application.Executions.Services;
using OpenFlow.Contracts.Common;

namespace OpenFlow.Application.Executions.Commands.RetryExecutionStep;

public class RetryExecutionStepHandler : ICommandHandler<RetryExecutionStepCommand, ApiResponse<bool>>
{
    private readonly IWorkflowExecutionEngine _engine;

    public RetryExecutionStepHandler(IWorkflowExecutionEngine engine) => _engine = engine;

    public async Task<ApiResponse<bool>> HandleAsync(RetryExecutionStepCommand command, CancellationToken ct = default)
    {
        var result = await _engine.ResumeExecutionAsync(command.ExecutionId, command.NodeKey, "{}", ct);
        return result.IsSuccess ? ApiResponse<bool>.Ok(true) : ApiResponse<bool>.Fail(result.Error);
    }
}
