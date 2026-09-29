using System.Text.Json;
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
