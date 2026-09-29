namespace OpenFlow.Contracts.Executions;

public class StartExecutionRequest
{
    public Guid WorkflowVersionId { get; set; }
    public Guid? SimulationRunId { get; set; }
    public string? SubjectId { get; set; }
    public string InitialContextJson { get; set; } = "{}";
}
