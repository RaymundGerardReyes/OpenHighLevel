using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Executions;

namespace OpenFlow.Application.Executions.Queries.GetExecutionTrace;

public class GetExecutionTraceHandler : IQueryHandler<GetExecutionTraceQuery, ApiResponse<ExecutionTraceDto>>
{
    private readonly IApplicationDbContext _db;

    public GetExecutionTraceHandler(IApplicationDbContext db) => _db = db;

    public Task<ApiResponse<ExecutionTraceDto>> HandleAsync(GetExecutionTraceQuery query, CancellationToken ct = default)
    {
        var execution = _db.Executions.FirstOrDefault(e => e.Id == query.ExecutionId);
        if (execution == null) return Task.FromResult(ApiResponse<ExecutionTraceDto>.Fail("Execution not found."));

        var steps = _db.ExecutionSteps
            .Where(s => s.ExecutionId == query.ExecutionId)
            .OrderBy(s => s.ExecutedAtUtc)
            .Select(s => new ExecutionStepDto
            {
                Id = s.Id,
                NodeKey = s.NodeKey,
                Attempt = s.Attempt,
                InputJson = s.InputJson,
                OutputJson = s.OutputJson,
                StateDiffJson = s.StateDiffJson,
                Status = s.Status.ToString(),
                ErrorMessage = s.ErrorMessage,
                DurationMs = s.DurationMs,
                ExecutedAtUtc = s.ExecutedAtUtc
            })
            .ToList();

        var trace = new ExecutionTraceDto
        {
            ExecutionId = execution.Id,
            Status = execution.Status.ToString(),
            Steps = steps
        };

        return Task.FromResult(ApiResponse<ExecutionTraceDto>.Ok(trace));
    }
}
