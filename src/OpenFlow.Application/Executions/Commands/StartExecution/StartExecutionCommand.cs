using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Executions;

namespace OpenFlow.Application.Executions.Commands.StartExecution;

public record StartExecutionCommand(
    Guid WorkflowVersionId,
    Guid? SimulationRunId,
    string? SubjectId,
    string InitialContextJson
) : ICommand<ApiResponse<StartExecutionResponse>>;
