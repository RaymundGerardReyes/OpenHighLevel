using OpenFlow.Domain.Common;

namespace OpenFlow.Application.Workflows.Services;

public interface IWorkflowGraphValidationService
{
    Result ValidateGraph(string definitionJson);
}
