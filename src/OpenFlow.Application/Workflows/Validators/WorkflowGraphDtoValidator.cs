using OpenFlow.Contracts.Workflows;
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
