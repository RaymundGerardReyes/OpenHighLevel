using OpenFlow.Application.Abstractions;
using OpenFlow.Application.Executions.Services;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Executions;

namespace OpenFlow.Application.Executions.Commands.StartExecution;

public class StartExecutionHandler : ICommandHandler<StartExecutionCommand, ApiResponse<StartExecutionResponse>>
{
    private readonly IWorkflowExecutionEngine _engine;
    private readonly StartExecutionValidator _validator = new();

    public StartExecutionHandler(IWorkflowExecutionEngine engine) => _engine = engine;

    public async Task<ApiResponse<StartExecutionResponse>> HandleAsync(StartExecutionCommand command, CancellationToken ct = default)
    {
        var validation = _validator.Validate(command);
        if (validation.IsFailure) return ApiResponse<StartExecutionResponse>.Fail(validation.Error);

        var result = await _engine.StartExecutionAsync(command.WorkflowVersionId, command.SimulationRunId, command.SubjectId, command.InitialContextJson, ct);
        if (result.IsFailure) return ApiResponse<StartExecutionResponse>.Fail(result.Error);

        var execution = result.Value!;
        return ApiResponse<StartExecutionResponse>.Ok(new StartExecutionResponse
        {
            ExecutionId = execution.Id,
            Status = execution.Status.ToString(),
            StartNodeKey = execution.CurrentNodeKey
        });
    }
}
