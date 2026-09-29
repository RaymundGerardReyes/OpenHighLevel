using OpenFlow.Contracts.Workflows;
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
