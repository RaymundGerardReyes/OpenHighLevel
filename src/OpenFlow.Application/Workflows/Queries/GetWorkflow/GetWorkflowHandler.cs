using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Workflows;

namespace OpenFlow.Application.Workflows.Queries.GetWorkflow;

public class GetWorkflowHandler : IQueryHandler<GetWorkflowQuery, ApiResponse<WorkflowDto>>
{
    private readonly IApplicationDbContext _db;

    public GetWorkflowHandler(IApplicationDbContext db) => _db = db;

    public Task<ApiResponse<WorkflowDto>> HandleAsync(GetWorkflowQuery query, CancellationToken ct = default)
    {
        var workflow = _db.Workflows.FirstOrDefault(w => w.Id == query.WorkflowId);
        if (workflow == null) return Task.FromResult(ApiResponse<WorkflowDto>.Fail("Workflow not found."));

        var dto = new WorkflowDto
        {
            Id = workflow.Id,
            Name = workflow.Name,
            Description = workflow.Description,
            Status = workflow.Status.ToString(),
            CurrentDraftVersionId = workflow.CurrentDraftVersionId,
            PublishedVersionId = workflow.PublishedVersionId,
            LatestVersionNumber = workflow.LatestVersionNumber,
            UpdatedAtUtc = workflow.UpdatedAtUtc
        };

        return Task.FromResult(ApiResponse<WorkflowDto>.Ok(dto));
    }
}
