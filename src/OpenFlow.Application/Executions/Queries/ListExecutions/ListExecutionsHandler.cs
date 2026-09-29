using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Executions;

namespace OpenFlow.Application.Executions.Queries.ListExecutions;

public class ListExecutionsHandler : IQueryHandler<ListExecutionsQuery, ApiResponse<PagedList<ExecutionTraceDto>>>
{
    private readonly IApplicationDbContext _db;

    public ListExecutionsHandler(IApplicationDbContext db) => _db = db;

    public Task<ApiResponse<PagedList<ExecutionTraceDto>>> HandleAsync(ListExecutionsQuery query, CancellationToken ct = default)
    {
        var items = _db.Executions
            .OrderByDescending(e => e.CreatedAtUtc)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(e => new ExecutionTraceDto
            {
                ExecutionId = e.Id,
                Status = e.Status.ToString(),
                Steps = new()
            })
            .ToList();

        var paged = new PagedList<ExecutionTraceDto>(items, _db.Executions.Count, query.Page, query.PageSize);
        return Task.FromResult(ApiResponse<PagedList<ExecutionTraceDto>>.Ok(paged));
    }
}
