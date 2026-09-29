using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Workflows;
using OpenFlow.Domain.Workflows;

namespace OpenFlow.Application.Workflows.Commands.CreateWorkflow;

public class CreateWorkflowHandler : ICommandHandler<CreateWorkflowCommand, ApiResponse<CreateWorkflowResponse>>
{
    private readonly IApplicationDbContext _db;
    private readonly ISimulationClock _clock;
    private readonly CreateWorkflowValidator _validator;

    public CreateWorkflowHandler(IApplicationDbContext db, ISimulationClock clock, CreateWorkflowValidator? validator = null)
    {
        _db = db;
        _clock = clock;
        _validator = validator ?? new CreateWorkflowValidator();
    }

    public async Task<ApiResponse<CreateWorkflowResponse>> HandleAsync(CreateWorkflowCommand command, CancellationToken ct = default)
    {
        var validation = _validator.Validate(command);
        if (validation.IsFailure) return ApiResponse<CreateWorkflowResponse>.Fail(validation.Error);

        var workflow = new Workflow(Guid.NewGuid(), command.Name, command.Description, _clock.UtcNow);
        _db.Workflows.Add(workflow);
        await _db.SaveChangesAsync(ct);

        return ApiResponse<CreateWorkflowResponse>.Ok(new CreateWorkflowResponse
        {
            WorkflowId = workflow.Id,
            Name = workflow.Name,
            Status = workflow.Status.ToString()
        });
    }
}
