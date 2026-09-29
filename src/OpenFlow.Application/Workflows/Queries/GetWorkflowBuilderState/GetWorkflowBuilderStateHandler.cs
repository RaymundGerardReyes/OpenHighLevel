using System.Text.Json;
using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Workflows;

namespace OpenFlow.Application.Workflows.Queries.GetWorkflowBuilderState;

public class GetWorkflowBuilderStateHandler : IQueryHandler<GetWorkflowBuilderStateQuery, ApiResponse<WorkflowGraphDto>>
{
    private readonly IApplicationDbContext _db;

    public GetWorkflowBuilderStateHandler(IApplicationDbContext db) => _db = db;

    public Task<ApiResponse<WorkflowGraphDto>> HandleAsync(GetWorkflowBuilderStateQuery query, CancellationToken ct = default)
    {
        var workflow = _db.Workflows.FirstOrDefault(w => w.Id == query.WorkflowId);
        if (workflow == null) return Task.FromResult(ApiResponse<WorkflowGraphDto>.Fail("Workflow not found."));

        var versionId = workflow.CurrentDraftVersionId ?? workflow.PublishedVersionId;
        if (versionId == null) return Task.FromResult(ApiResponse<WorkflowGraphDto>.Ok(new WorkflowGraphDto()));

        var version = _db.WorkflowVersions.FirstOrDefault(v => v.Id == versionId.Value);
        if (version == null) return Task.FromResult(ApiResponse<WorkflowGraphDto>.Ok(new WorkflowGraphDto()));

        var graph = JsonSerializer.Deserialize<WorkflowGraphDto>(version.DefinitionJson) ?? new WorkflowGraphDto();
        return Task.FromResult(ApiResponse<WorkflowGraphDto>.Ok(graph));
    }
}
