using OpenFlow.Domain.Common;
using OpenFlow.Domain.Executions;

namespace OpenFlow.Application.Executions.Services;

public interface IWorkflowExecutionEngine
{
    Task<Result<Execution>> StartExecutionAsync(Guid versionId, Guid? simulationRunId, string? subjectId, string initialContextJson, CancellationToken ct = default);
    Task<Result> ResumeExecutionAsync(Guid executionId, string nodeKey, string contextJson, CancellationToken ct = default);
}
