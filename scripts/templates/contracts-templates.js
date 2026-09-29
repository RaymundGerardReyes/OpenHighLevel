// scripts/templates/contracts-templates.js
// Contract models and shared DTOs for OpenFlow.Contracts

export const contractsTemplates = {
  // Common
  'src/OpenFlow.Contracts/Common/ApiResponse.cs': `namespace OpenFlow.Contracts.Common;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Error { get; set; }
    public string TraceId { get; set; } = string.Empty;

    public static ApiResponse<T> Ok(T data, string traceId = "") =>
        new() { Success = true, Data = data, TraceId = traceId };

    public static ApiResponse<T> Fail(string error, string traceId = "") =>
        new() { Success = false, Error = error, TraceId = traceId };
}
`,

  'src/OpenFlow.Contracts/Common/PagedList.cs': `namespace OpenFlow.Contracts.Common;

public class PagedList<T>
{
    public List<T> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);

    public PagedList() { }
    public PagedList(List<T> items, int totalCount, int page, int pageSize)
    {
        Items = items;
        TotalCount = totalCount;
        Page = page;
        PageSize = pageSize;
    }
}
`,

  // Workflows
  'src/OpenFlow.Contracts/Workflows/WorkflowNodeDto.cs': `namespace OpenFlow.Contracts.Workflows;

public class WorkflowNodeDto
{
    public string NodeKey { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ConfigJson { get; set; } = "{}";
    public double PositionX { get; set; }
    public double PositionY { get; set; }
}
`,

  'src/OpenFlow.Contracts/Workflows/WorkflowEdgeDto.cs': `namespace OpenFlow.Contracts.Workflows;

public class WorkflowEdgeDto
{
    public string SourceNodeKey { get; set; } = string.Empty;
    public string SourcePort { get; set; } = "default";
    public string TargetNodeKey { get; set; } = string.Empty;
    public int Priority { get; set; }
}
`,

  'src/OpenFlow.Contracts/Workflows/WorkflowGraphDto.cs': `namespace OpenFlow.Contracts.Workflows;

public class WorkflowGraphDto
{
    public List<WorkflowNodeDto> Nodes { get; set; } = new();
    public List<WorkflowEdgeDto> Edges { get; set; } = new();
}
`,

  'src/OpenFlow.Contracts/Workflows/WorkflowDto.cs': `namespace OpenFlow.Contracts.Workflows;

public class WorkflowDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid? CurrentDraftVersionId { get; set; }
    public Guid? PublishedVersionId { get; set; }
    public int LatestVersionNumber { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
`,

  'src/OpenFlow.Contracts/Workflows/CreateWorkflowRequest.cs': `namespace OpenFlow.Contracts.Workflows;

public class CreateWorkflowRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
`,

  'src/OpenFlow.Contracts/Workflows/CreateWorkflowResponse.cs': `namespace OpenFlow.Contracts.Workflows;

public class CreateWorkflowResponse
{
    public Guid WorkflowId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}
`,

  'src/OpenFlow.Contracts/Workflows/UpdateWorkflowDraftRequest.cs': `namespace OpenFlow.Contracts.Workflows;

public class UpdateWorkflowDraftRequest
{
    public Guid WorkflowId { get; set; }
    public WorkflowGraphDto Graph { get; set; } = new();
}
`,

  'src/OpenFlow.Contracts/Workflows/PublishWorkflowResponse.cs': `namespace OpenFlow.Contracts.Workflows;

public class PublishWorkflowResponse
{
    public Guid WorkflowId { get; set; }
    public Guid PublishedVersionId { get; set; }
    public int VersionNumber { get; set; }
    public DateTime PublishedAtUtc { get; set; }
}
`,

  // Executions
  'src/OpenFlow.Contracts/Executions/StartExecutionRequest.cs': `namespace OpenFlow.Contracts.Executions;

public class StartExecutionRequest
{
    public Guid WorkflowVersionId { get; set; }
    public Guid? SimulationRunId { get; set; }
    public string? SubjectId { get; set; }
    public string InitialContextJson { get; set; } = "{}";
}
`,

  'src/OpenFlow.Contracts/Executions/StartExecutionResponse.cs': `namespace OpenFlow.Contracts.Executions;

public class StartExecutionResponse
{
    public Guid ExecutionId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string StartNodeKey { get; set; } = string.Empty;
}
`,

  'src/OpenFlow.Contracts/Executions/ResumeExecutionRequest.cs': `namespace OpenFlow.Contracts.Executions;

public class ResumeExecutionRequest
{
    public Guid ExecutionId { get; set; }
    public string NodeKey { get; set; } = string.Empty;
    public string ContextJson { get; set; } = "{}";
}
`,

  'src/OpenFlow.Contracts/Executions/ExecutionStepDto.cs': `namespace OpenFlow.Contracts.Executions;

public class ExecutionStepDto
{
    public Guid Id { get; set; }
    public string NodeKey { get; set; } = string.Empty;
    public int Attempt { get; set; }
    public string InputJson { get; set; } = "{}";
    public string OutputJson { get; set; } = "{}";
    public string StateDiffJson { get; set; } = "{}";
    public string Status { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
    public long DurationMs { get; set; }
    public DateTime ExecutedAtUtc { get; set; }
}
`,

  'src/OpenFlow.Contracts/Executions/ExecutionTraceDto.cs': `namespace OpenFlow.Contracts.Executions;

public class ExecutionTraceDto
{
    public Guid ExecutionId { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<ExecutionStepDto> Steps { get; set; } = new();
}
`,

  // SimulationRuns
  'src/OpenFlow.Contracts/SimulationRuns/StartSimulationRequest.cs': `namespace OpenFlow.Contracts.SimulationRuns;

public class StartSimulationRequest
{
    public Guid WorkflowVersionId { get; set; }
    public string Mode { get; set; } = "FastSimulation";
    public string InitialStateJson { get; set; } = "{}";
    public string ContactEmail { get; set; } = string.Empty;
}
`,

  'src/OpenFlow.Contracts/SimulationRuns/SimulationRunDto.cs': `namespace OpenFlow.Contracts.SimulationRuns;

public class SimulationRunDto
{
    public Guid Id { get; set; }
    public Guid WorkflowVersionId { get; set; }
    public string Mode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime ClockStartUtc { get; set; }
    public DateTime CurrentClockUtc { get; set; }
    public string FinalStateJson { get; set; } = "{}";
}
`,

  // Contacts
  'src/OpenFlow.Contracts/Contacts/ContactDto.cs': `namespace OpenFlow.Contracts.Contacts;

public class ContactDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public Dictionary<string, string> CustomFields { get; set; } = new();
}
`,
};
