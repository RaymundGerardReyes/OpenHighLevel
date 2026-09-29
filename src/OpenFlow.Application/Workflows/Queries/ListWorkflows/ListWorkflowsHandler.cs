using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Workflows;

namespace OpenFlow.Application.Workflows.Queries.ListWorkflows;

public class ListWorkflowsHandler : IQueryHandler<ListWorkflowsQuery, ApiResponse<PagedList<WorkflowDto>>>
{
    private readonly IApplicationDbContext _db;

    public ListWorkflowsHandler(IApplicationDbContext db) => _db = db;

    public Task<ApiResponse<PagedList<WorkflowDto>>> HandleAsync(ListWorkflowsQuery query, CancellationToken ct = default)
    {
        var items = _db.Workflows
            .OrderByDescending(w => w.UpdatedAtUtc)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(w => new WorkflowDto
            {
                Id = w.Id,
                Name = w.Name,
                Description = w.Description,
                Status = w.Status.ToString(),
                CurrentDraftVersionId = w.CurrentDraftVersionId,
                PublishedVersionId = w.PublishedVersionId,
                LatestVersionNumber = w.LatestVersionNumber,
                UpdatedAtUtc = w.UpdatedAtUtc
            })
            .ToList();

        var paged = new PagedList<WorkflowDto>(items, _db.Workflows.Count, query.Page, query.PageSize);
        return Task.FromResult(ApiResponse<PagedList<WorkflowDto>>.Ok(paged));
    }
}
