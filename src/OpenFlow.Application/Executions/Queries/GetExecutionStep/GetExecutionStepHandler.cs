using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Executions;

namespace OpenFlow.Application.Executions.Queries.GetExecutionStep;

public class GetExecutionStepHandler : IQueryHandler<GetExecutionStepQuery, ApiResponse<ExecutionStepDto>>
{
    private readonly IApplicationDbContext _db;

    public GetExecutionStepHandler(IApplicationDbContext db) => _db = db;

    public Task<ApiResponse<ExecutionStepDto>> HandleAsync(GetExecutionStepQuery query, CancellationToken ct = default)
    {
        var s = _db.ExecutionSteps.FirstOrDefault(step => step.Id == query.StepId);
        if (s == null) return Task.FromResult(ApiResponse<ExecutionStepDto>.Fail("Step not found."));

        var dto = new ExecutionStepDto
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
        };

        return Task.FromResult(ApiResponse<ExecutionStepDto>.Ok(dto));
    }
}
