using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;

namespace OpenFlow.Application.Workflows.Commands.ArchiveWorkflow;

public class ArchiveWorkflowHandler : ICommandHandler<ArchiveWorkflowCommand, ApiResponse<bool>>
{
    private readonly IApplicationDbContext _db;
    private readonly ISimulationClock _clock;

    public ArchiveWorkflowHandler(IApplicationDbContext db, ISimulationClock clock)
    {
        _db = db;
        _clock = clock;
    }

    public async Task<ApiResponse<bool>> HandleAsync(ArchiveWorkflowCommand command, CancellationToken ct = default)
    {
        var workflow = _db.Workflows.FirstOrDefault(w => w.Id == command.WorkflowId);
        if (workflow == null) return ApiResponse<bool>.Fail("Workflow not found.");

        workflow.Archive(_clock.UtcNow);
        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
