using OpenFlow.Application.Abstractions;
using OpenFlow.Application.Workflows.Services;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Workflows;
using OpenFlow.Domain.Workflows;

namespace OpenFlow.Application.Workflows.Commands.PublishWorkflowVersion;

public class PublishWorkflowVersionHandler : ICommandHandler<PublishWorkflowVersionCommand, ApiResponse<PublishWorkflowResponse>>
{
    private readonly IApplicationDbContext _db;
    private readonly IWorkflowGraphValidationService _validationService;
    private readonly ISimulationClock _clock;

    public PublishWorkflowVersionHandler(IApplicationDbContext db, IWorkflowGraphValidationService validationService, ISimulationClock clock)
    {
        _db = db;
        _validationService = validationService;
        _clock = clock;
    }

    public async Task<ApiResponse<PublishWorkflowResponse>> HandleAsync(PublishWorkflowVersionCommand command, CancellationToken ct = default)
    {
        var workflow = _db.Workflows.FirstOrDefault(w => w.Id == command.WorkflowId);
        if (workflow == null) return ApiResponse<PublishWorkflowResponse>.Fail("Workflow not found.");
        if (workflow.CurrentDraftVersionId == null)
            return ApiResponse<PublishWorkflowResponse>.Fail("No active draft to publish.");

        var draft = _db.WorkflowVersions.FirstOrDefault(v => v.Id == workflow.CurrentDraftVersionId.Value);
        if (draft == null) return ApiResponse<PublishWorkflowResponse>.Fail("Draft version not found.");

        var validation = _validationService.ValidateGraph(draft.DefinitionJson);
        if (validation.IsFailure) return ApiResponse<PublishWorkflowResponse>.Fail(validation.Error);

        var now = _clock.UtcNow;
        var nextVersionNumber = workflow.LatestVersionNumber + 1;
        var publishedVersion = new WorkflowVersion(
            Guid.NewGuid(),
            workflow.Id,
            nextVersionNumber,
            draft.DefinitionJson,
            now,
            now
        );

        _db.WorkflowVersions.Add(publishedVersion);
        workflow.PublishVersion(publishedVersion.Id, nextVersionNumber, now);

        await _db.SaveChangesAsync(ct);

        return ApiResponse<PublishWorkflowResponse>.Ok(new PublishWorkflowResponse
        {
            WorkflowId = workflow.Id,
            PublishedVersionId = publishedVersion.Id,
            VersionNumber = nextVersionNumber,
            PublishedAtUtc = now
        });
    }
}
