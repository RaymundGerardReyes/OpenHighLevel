using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;

namespace OpenFlow.Application.Executions.Commands.CancelExecution;

public class CancelExecutionHandler : ICommandHandler<CancelExecutionCommand, ApiResponse<bool>>
{
    private readonly IApplicationDbContext _db;
    private readonly ISimulationClock _clock;

    public CancelExecutionHandler(IApplicationDbContext db, ISimulationClock clock)
    {
        _db = db;
        _clock = clock;
    }

    public async Task<ApiResponse<bool>> HandleAsync(CancelExecutionCommand command, CancellationToken ct = default)
    {
        var execution = _db.Executions.FirstOrDefault(e => e.Id == command.ExecutionId);
        if (execution == null) return ApiResponse<bool>.Fail("Execution not found.");

        execution.Cancel(_clock.UtcNow);
        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
