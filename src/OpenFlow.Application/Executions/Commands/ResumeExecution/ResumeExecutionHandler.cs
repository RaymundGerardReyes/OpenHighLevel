using OpenFlow.Application.Abstractions;
using OpenFlow.Application.Executions.Services;
using OpenFlow.Contracts.Common;

namespace OpenFlow.Application.Executions.Commands.ResumeExecution;

public class ResumeExecutionHandler : ICommandHandler<ResumeExecutionCommand, ApiResponse<bool>>
{
    private readonly IWorkflowExecutionEngine _engine;
    private readonly ResumeExecutionValidator _validator = new();

    public ResumeExecutionHandler(IWorkflowExecutionEngine engine) => _engine = engine;

    public async Task<ApiResponse<bool>> HandleAsync(ResumeExecutionCommand command, CancellationToken ct = default)
    {
        var validation = _validator.Validate(command);
        if (validation.IsFailure) return ApiResponse<bool>.Fail(validation.Error);

        var result = await _engine.ResumeExecutionAsync(command.ExecutionId, command.NodeKey, command.ContextJson, ct);
        return result.IsSuccess ? ApiResponse<bool>.Ok(true) : ApiResponse<bool>.Fail(result.Error);
    }
}
