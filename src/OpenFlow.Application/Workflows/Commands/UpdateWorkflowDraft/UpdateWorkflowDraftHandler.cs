using System.Text.Json;
using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Domain.Workflows;

namespace OpenFlow.Application.Workflows.Commands.UpdateWorkflowDraft;

public class UpdateWorkflowDraftHandler : ICommandHandler<UpdateWorkflowDraftCommand, ApiResponse<bool>>
{
    private readonly IApplicationDbContext _db;
    private readonly ISimulationClock _clock;
    private readonly UpdateWorkflowDraftValidator _validator;

    public UpdateWorkflowDraftHandler(IApplicationDbContext db, ISimulationClock clock, UpdateWorkflowDraftValidator? validator = null)
    {
        _db = db;
        _clock = clock;
        _validator = validator ?? new UpdateWorkflowDraftValidator();
    }

    public async Task<ApiResponse<bool>> HandleAsync(UpdateWorkflowDraftCommand command, CancellationToken ct = default)
    {
        var validation = _validator.Validate(command);
        if (validation.IsFailure) return ApiResponse<bool>.Fail(validation.Error);

        var workflow = _db.Workflows.FirstOrDefault(w => w.Id == command.WorkflowId);
        if (workflow == null) return ApiResponse<bool>.Fail("Workflow not found.");

        var now = _clock.UtcNow;
        var draftVersion = new WorkflowVersion(
            Guid.NewGuid(),
            workflow.Id,
            workflow.LatestVersionNumber,
            JsonSerializer.Serialize(command.Graph),
            now
        );

        _db.WorkflowVersions.Add(draftVersion);
        workflow.UpdateDraft(draftVersion.Id, now);

        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
