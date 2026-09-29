using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Executions;

public class Execution : AggregateRoot<Guid>
{
    public Guid WorkflowVersionId { get; private set; }
    public Guid? SimulationRunId { get; private set; }
    public string? SubjectId { get; private set; }
    public string CurrentNodeKey { get; private set; } = string.Empty;
    public ExecutionStatus Status { get; private set; } = ExecutionStatus.Pending;
    public string ContextJson { get; private set; } = "{}";
    public WaitState? CurrentWaitState { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? CompletedAtUtc { get; private set; }

    private Execution() { }

    public Execution(Guid id, Guid workflowVersionId, Guid? simulationRunId, string? subjectId, string startNodeKey, string initialContextJson, DateTime createdAtUtc)
        : base(id)
    {
        WorkflowVersionId = workflowVersionId;
        SimulationRunId = simulationRunId;
        SubjectId = subjectId;
        CurrentNodeKey = startNodeKey;
        ContextJson = initialContextJson;
        Status = ExecutionStatus.Pending;
        CreatedAtUtc = createdAtUtc;
    }

    public void Start() => Status = ExecutionStatus.Running;

    public void MoveToNode(string nextNodeKey, string updatedContextJson)
    {
        CurrentNodeKey = nextNodeKey;
        ContextJson = updatedContextJson;
        CurrentWaitState = null;
        Status = ExecutionStatus.Running;
    }

    public void SetWaiting(WaitState waitState)
    {
        CurrentWaitState = waitState;
        Status = ExecutionStatus.Waiting;
    }

    public void UpdateContext(string updatedContextJson)
    {
        ContextJson = updatedContextJson;
    }

    public void Complete(DateTime completedAtUtc)
    {
        Status = ExecutionStatus.Completed;
        CompletedAtUtc = completedAtUtc;
    }

    public void Fail(DateTime failedAtUtc)
    {
        Status = ExecutionStatus.Failed;
        CompletedAtUtc = failedAtUtc;
    }

    public void Cancel(DateTime cancelledAtUtc)
    {
        Status = ExecutionStatus.Cancelled;
        CompletedAtUtc = cancelledAtUtc;
    }
}
