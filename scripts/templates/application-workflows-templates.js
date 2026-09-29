// application-workflows-templates.js
// Workflow feature slice: CQRS handlers, services, validators, and mappers

export const applicationWorkflowsTemplates = {
  'src/OpenFlow.Application/Workflows/Commands/CreateWorkflow/CreateWorkflowCommand.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Workflows;

namespace OpenFlow.Application.Workflows.Commands.CreateWorkflow;

public record CreateWorkflowCommand(string Name, string Description) : ICommand<ApiResponse<CreateWorkflowResponse>>;
`,

  'src/OpenFlow.Application/Workflows/Commands/CreateWorkflow/CreateWorkflowValidator.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Application.Workflows.Commands.CreateWorkflow;

public class CreateWorkflowValidator
{
    public Result Validate(CreateWorkflowCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.Name))
            return Result.Failure("Workflow name is required.");
        if (command.Name.Length > 100)
            return Result.Failure("Workflow name cannot exceed 100 characters.");
        return Result.Success();
    }
}
`,

  'src/OpenFlow.Application/Workflows/Commands/CreateWorkflow/CreateWorkflowHandler.cs': `using OpenFlow.Application.Abstractions;
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
`,

  'src/OpenFlow.Application/Workflows/Commands/UpdateWorkflowDraft/UpdateWorkflowDraftCommand.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Workflows;

namespace OpenFlow.Application.Workflows.Commands.UpdateWorkflowDraft;

public record UpdateWorkflowDraftCommand(Guid WorkflowId, WorkflowGraphDto Graph) : ICommand<ApiResponse<bool>>;
`,

  'src/OpenFlow.Application/Workflows/Commands/UpdateWorkflowDraft/UpdateWorkflowDraftValidator.cs': `using OpenFlow.Domain.Common;
using OpenFlow.Application.Workflows.Validators;

namespace OpenFlow.Application.Workflows.Commands.UpdateWorkflowDraft;

public class UpdateWorkflowDraftValidator
{
    private readonly WorkflowGraphDtoValidator _graphValidator = new();

    public Result Validate(UpdateWorkflowDraftCommand command)
    {
        if (command.WorkflowId == Guid.Empty)
            return Result.Failure("Valid WorkflowId is required.");
        return _graphValidator.Validate(command.Graph);
    }
}
`,

  'src/OpenFlow.Application/Workflows/Commands/UpdateWorkflowDraft/UpdateWorkflowDraftHandler.cs': `using System.Text.Json;
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
`,

  'src/OpenFlow.Application/Workflows/Commands/PublishWorkflowVersion/PublishWorkflowVersionCommand.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Workflows;

namespace OpenFlow.Application.Workflows.Commands.PublishWorkflowVersion;

public record PublishWorkflowVersionCommand(Guid WorkflowId) : ICommand<ApiResponse<PublishWorkflowResponse>>;
`,

  'src/OpenFlow.Application/Workflows/Commands/PublishWorkflowVersion/PublishWorkflowVersionValidator.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Application.Workflows.Commands.PublishWorkflowVersion;

public class PublishWorkflowVersionValidator
{
    public Result Validate(PublishWorkflowVersionCommand command)
    {
        if (command.WorkflowId == Guid.Empty)
            return Result.Failure("Valid WorkflowId is required.");
        return Result.Success();
    }
}
`,

  'src/OpenFlow.Application/Workflows/Commands/PublishWorkflowVersion/PublishWorkflowVersionHandler.cs': `using OpenFlow.Application.Abstractions;
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
`,

  'src/OpenFlow.Application/Workflows/Commands/ArchiveWorkflow/ArchiveWorkflowCommand.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;

namespace OpenFlow.Application.Workflows.Commands.ArchiveWorkflow;

public record ArchiveWorkflowCommand(Guid WorkflowId) : ICommand<ApiResponse<bool>>;
`,

  'src/OpenFlow.Application/Workflows/Commands/ArchiveWorkflow/ArchiveWorkflowValidator.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Application.Workflows.Commands.ArchiveWorkflow;

public class ArchiveWorkflowValidator
{
    public Result Validate(ArchiveWorkflowCommand command)
    {
        if (command.WorkflowId == Guid.Empty)
            return Result.Failure("Valid WorkflowId is required.");
        return Result.Success();
    }
}
`,

  'src/OpenFlow.Application/Workflows/Commands/ArchiveWorkflow/ArchiveWorkflowHandler.cs': `using OpenFlow.Application.Abstractions;
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
`,

  'src/OpenFlow.Application/Workflows/Queries/GetWorkflow/GetWorkflowQuery.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Workflows;

namespace OpenFlow.Application.Workflows.Queries.GetWorkflow;

public record GetWorkflowQuery(Guid WorkflowId) : IQuery<ApiResponse<WorkflowDto>>;
`,

  'src/OpenFlow.Application/Workflows/Queries/GetWorkflow/GetWorkflowHandler.cs': `using OpenFlow.Application.Abstractions;
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
`,

  'src/OpenFlow.Application/Workflows/Queries/ListWorkflows/ListWorkflowsQuery.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Workflows;

namespace OpenFlow.Application.Workflows.Queries.ListWorkflows;

public record ListWorkflowsQuery(int Page = 1, int PageSize = 20) : IQuery<ApiResponse<PagedList<WorkflowDto>>>;
`,

  'src/OpenFlow.Application/Workflows/Queries/ListWorkflows/ListWorkflowsHandler.cs': `using OpenFlow.Application.Abstractions;
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
`,

  'src/OpenFlow.Application/Workflows/Queries/GetWorkflowBuilderState/GetWorkflowBuilderStateQuery.cs': `using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;
using OpenFlow.Contracts.Workflows;

namespace OpenFlow.Application.Workflows.Queries.GetWorkflowBuilderState;

public record GetWorkflowBuilderStateQuery(Guid WorkflowId) : IQuery<ApiResponse<WorkflowGraphDto>>;
`,

  'src/OpenFlow.Application/Workflows/Queries/GetWorkflowBuilderState/GetWorkflowBuilderStateHandler.cs': `using System.Text.Json;
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
`,

  'src/OpenFlow.Application/Workflows/Validators/WorkflowGraphDtoValidator.cs': `using OpenFlow.Contracts.Workflows;
using OpenFlow.Domain.Common;

namespace OpenFlow.Application.Workflows.Validators;

public class WorkflowGraphDtoValidator
{
    public Result Validate(WorkflowGraphDto graph)
    {
        if (graph.Nodes == null || graph.Nodes.Count == 0)
            return Result.Failure("Workflow graph must contain at least one node.");

        var hasTrigger = graph.Nodes.Any(n => n.Type.Equals("Trigger", StringComparison.OrdinalIgnoreCase));
        if (!hasTrigger)
            return Result.Failure("Workflow graph must include at least one Trigger node.");

        var nodeKeys = new HashSet<string>();
        foreach (var node in graph.Nodes)
        {
            if (string.IsNullOrWhiteSpace(node.NodeKey))
                return Result.Failure("Each node must have a valid NodeKey.");
            if (!nodeKeys.Add(node.NodeKey))
                return Result.Failure($"Duplicate NodeKey '{node.NodeKey}' detected in graph.");
        }

        foreach (var edge in graph.Edges ?? Enumerable.Empty<WorkflowEdgeDto>())
        {
            if (!nodeKeys.Contains(edge.SourceNodeKey))
                return Result.Failure($"Edge references missing source node '{edge.SourceNodeKey}'.");
            if (!nodeKeys.Contains(edge.TargetNodeKey))
                return Result.Failure($"Edge references missing target node '{edge.TargetNodeKey}'.");
        }

        return Result.Success();
    }
}
`,

  'src/OpenFlow.Application/Workflows/Services/IWorkflowGraphValidationService.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Application.Workflows.Services;

public interface IWorkflowGraphValidationService
{
    Result ValidateGraph(string definitionJson);
}
`,

  'src/OpenFlow.Application/Workflows/Services/WorkflowGraphValidationService.cs': `using System.Text.Json;
using OpenFlow.Application.Workflows.Validators;
using OpenFlow.Contracts.Workflows;
using OpenFlow.Domain.Common;

namespace OpenFlow.Application.Workflows.Services;

public class WorkflowGraphValidationService : IWorkflowGraphValidationService
{
    private readonly WorkflowGraphDtoValidator _validator = new();

    public Result ValidateGraph(string definitionJson)
    {
        try
        {
            var graph = JsonSerializer.Deserialize<WorkflowGraphDto>(definitionJson);
            if (graph == null) return Result.Failure("Definition JSON is invalid or null.");
            return _validator.Validate(graph);
        }
        catch (Exception ex)
        {
            return Result.Failure($"Invalid JSON structure: {ex.Message}");
        }
    }
}
`,

  'src/OpenFlow.Application/Workflows/Mappers/WorkflowGraphMapper.cs': `using OpenFlow.Contracts.Workflows;
using OpenFlow.Domain.Workflows;

namespace OpenFlow.Application.Workflows.Mappers;

public static class WorkflowGraphMapper
{
    public static List<WorkflowNode> ToDomainNodes(Guid versionId, List<WorkflowNodeDto> dtoList)
    {
        return dtoList.Select(dto => new WorkflowNode(
            Guid.NewGuid(),
            versionId,
            dto.NodeKey,
            Enum.TryParse<NodeType>(dto.Type, true, out var nt) ? nt : NodeType.Trigger,
            dto.Name,
            dto.ConfigJson,
            dto.PositionX,
            dto.PositionY
        )).ToList();
    }

    public static List<WorkflowEdge> ToDomainEdges(Guid versionId, List<WorkflowEdgeDto> dtoList)
    {
        return dtoList.Select(dto => new WorkflowEdge(
            Guid.NewGuid(),
            versionId,
            dto.SourceNodeKey,
            dto.SourcePort,
            dto.TargetNodeKey,
            dto.Priority
        )).ToList();
    }
}
`,

};
