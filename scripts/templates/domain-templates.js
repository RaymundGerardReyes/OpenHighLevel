// domain-templates.js
// Domain layer: Aggregates, Entities, Value Objects, and Domain Events

export const domainTemplates = {
  'src/OpenFlow.Domain/Common/IAggregateRoot.cs': `namespace OpenFlow.Domain.Common;

public interface IAggregateRoot
{
}
`,

  'src/OpenFlow.Domain/Common/IDomainEvent.cs': `namespace OpenFlow.Domain.Common;

public interface IDomainEvent
{
    DateTime OccurredOnUtc { get; }
}
`,

  'src/OpenFlow.Domain/Common/Entity.cs': `namespace OpenFlow.Domain.Common;

public abstract class Entity<TId>
{
    public TId Id { get; protected set; } = default!;

    protected Entity() { }
    protected Entity(TId id) => Id = id;

    public override bool Equals(object? obj)
    {
        if (obj is not Entity<TId> other) return false;
        if (ReferenceEquals(this, other)) return true;
        if (GetType() != other.GetType()) return false;
        return EqualityComparer<TId>.Default.Equals(Id, other.Id);
    }

    public override int GetHashCode() => EqualityComparer<TId>.Default.GetHashCode(Id!);
}
`,

  'src/OpenFlow.Domain/Common/AggregateRoot.cs': `namespace OpenFlow.Domain.Common;

public abstract class AggregateRoot<TId> : Entity<TId>, IAggregateRoot
{
    private readonly List<IDomainEvent> _domainEvents = new();
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    protected AggregateRoot() { }
    protected AggregateRoot(TId id) : base(id) { }

    protected void AddDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);
    public void ClearDomainEvents() => _domainEvents.Clear();
}
`,

  'src/OpenFlow.Domain/Common/ValueObject.cs': `namespace OpenFlow.Domain.Common;

public abstract class ValueObject
{
    protected abstract IEnumerable<object?> GetEqualityComponents();

    public override bool Equals(object? obj)
    {
        if (obj is null || obj.GetType() != GetType()) return false;
        var other = (ValueObject)obj;
        return GetEqualityComponents().SequenceEqual(other.GetEqualityComponents());
    }

    public override int GetHashCode()
    {
        return GetEqualityComponents()
            .Select(x => x?.GetHashCode() ?? 0)
            .Aggregate((x, y) => x ^ y);
    }
}
`,

  'src/OpenFlow.Domain/Common/Result.cs': `namespace OpenFlow.Domain.Common;

public class Result
{
    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public string Error { get; }

    protected Result(bool isSuccess, string error)
    {
        IsSuccess = isSuccess;
        Error = error;
    }

    public static Result Success() => new(true, string.Empty);
    public static Result Failure(string error) => new(false, error);
}

public class Result<T> : Result
{
    public T? Value { get; }

    protected Result(bool isSuccess, T? value, string error) : base(isSuccess, error)
    {
        Value = value;
    }

    public static Result<T> Success(T value) => new(true, value, string.Empty);
    public static new Result<T> Failure(string error) => new(false, default, error);
}
`,

  'src/OpenFlow.Domain/Workflows/WorkflowStatus.cs': `namespace OpenFlow.Domain.Workflows;

public enum WorkflowStatus
{
    Draft = 1,
    Published = 2,
    Archived = 3
}
`,

  'src/OpenFlow.Domain/Workflows/NodeType.cs': `namespace OpenFlow.Domain.Workflows;

public enum NodeType
{
    Trigger = 1,
    SetContactField = 2,
    AddTag = 3,
    RemoveTag = 4,
    IfElse = 5,
    WaitDuration = 6,
    SendMessage = 7,
    Webhook = 8,
    Goal = 9,
    End = 10
}
`,

  'src/OpenFlow.Domain/Workflows/NodePort.cs': `namespace OpenFlow.Domain.Workflows;

public static class NodePort
{
    public const string Default = "default";
    public const string True = "true";
    public const string False = "false";
    public const string Matched = "matched";
    public const string Unmatched = "unmatched";
    public const string Timeout = "timeout";
}
`,

  'src/OpenFlow.Domain/Workflows/WorkflowNode.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Workflows;

public class WorkflowNode : Entity<Guid>
{
    public Guid WorkflowVersionId { get; private set; }
    public string NodeKey { get; private set; } = string.Empty;
    public NodeType Type { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string ConfigurationJson { get; private set; } = "{}";
    public double PositionX { get; private set; }
    public double PositionY { get; private set; }

    private WorkflowNode() { }

    public WorkflowNode(Guid id, Guid workflowVersionId, string nodeKey, NodeType type, string name, string configJson, double x = 0, double y = 0)
        : base(id)
    {
        WorkflowVersionId = workflowVersionId;
        NodeKey = nodeKey;
        Type = type;
        Name = name;
        ConfigurationJson = configJson;
        PositionX = x;
        PositionY = y;
    }
}
`,

  'src/OpenFlow.Domain/Workflows/WorkflowEdge.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Workflows;

public class WorkflowEdge : Entity<Guid>
{
    public Guid WorkflowVersionId { get; private set; }
    public string SourceNodeKey { get; private set; } = string.Empty;
    public string SourcePort { get; private set; } = NodePort.Default;
    public string TargetNodeKey { get; private set; } = string.Empty;
    public int Priority { get; private set; }

    private WorkflowEdge() { }

    public WorkflowEdge(Guid id, Guid workflowVersionId, string sourceNodeKey, string sourcePort, string targetNodeKey, int priority = 0)
        : base(id)
    {
        WorkflowVersionId = workflowVersionId;
        SourceNodeKey = sourceNodeKey;
        SourcePort = sourcePort;
        TargetNodeKey = targetNodeKey;
        Priority = priority;
    }
}
`,

  'src/OpenFlow.Domain/Workflows/WorkflowVersion.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Workflows;

public class WorkflowVersion : Entity<Guid>
{
    public Guid WorkflowId { get; private set; }
    public int VersionNumber { get; private set; }
    public string DefinitionJson { get; private set; } = "{}";
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? PublishedAtUtc { get; private set; }

    private WorkflowVersion() { }

    public WorkflowVersion(Guid id, Guid workflowId, int versionNumber, string definitionJson, DateTime createdAtUtc, DateTime? publishedAtUtc = null)
        : base(id)
    {
        WorkflowId = workflowId;
        VersionNumber = versionNumber;
        DefinitionJson = definitionJson;
        CreatedAtUtc = createdAtUtc;
        PublishedAtUtc = publishedAtUtc;
    }
}
`,

  'src/OpenFlow.Domain/Workflows/Workflow.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Workflows;

public class Workflow : AggregateRoot<Guid>
{
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public WorkflowStatus Status { get; private set; } = WorkflowStatus.Draft;
    public Guid? CurrentDraftVersionId { get; private set; }
    public Guid? PublishedVersionId { get; private set; }
    public int LatestVersionNumber { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }

    private Workflow() { }

    public Workflow(Guid id, string name, string description, DateTime createdAtUtc) : base(id)
    {
        Name = name;
        Description = description;
        Status = WorkflowStatus.Draft;
        CreatedAtUtc = createdAtUtc;
        UpdatedAtUtc = createdAtUtc;
        LatestVersionNumber = 1;
    }

    public void UpdateDraft(Guid draftVersionId, DateTime updatedAtUtc)
    {
        CurrentDraftVersionId = draftVersionId;
        UpdatedAtUtc = updatedAtUtc;
        if (Status == WorkflowStatus.Archived) Status = WorkflowStatus.Draft;
    }

    public void PublishVersion(Guid publishedVersionId, int versionNumber, DateTime publishedAtUtc)
    {
        PublishedVersionId = publishedVersionId;
        LatestVersionNumber = Math.Max(LatestVersionNumber, versionNumber);
        Status = WorkflowStatus.Published;
        UpdatedAtUtc = publishedAtUtc;
    }

    public void Archive(DateTime updatedAtUtc)
    {
        Status = WorkflowStatus.Archived;
        UpdatedAtUtc = updatedAtUtc;
    }
}
`,

  'src/OpenFlow.Domain/Executions/ExecutionStatus.cs': `namespace OpenFlow.Domain.Executions;

public enum ExecutionStatus
{
    Pending = 1,
    Running = 2,
    Waiting = 3,
    Completed = 4,
    Failed = 5,
    Cancelled = 6,
    Skipped = 7
}
`,

  'src/OpenFlow.Domain/Executions/WaitState.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Executions;

public class WaitState : ValueObject
{
    public DateTime DueAtUtc { get; }
    public string Reason { get; }
    public Guid? ScheduledTaskId { get; }

    public WaitState(DateTime dueAtUtc, string reason, Guid? scheduledTaskId = null)
    {
        DueAtUtc = dueAtUtc;
        Reason = reason;
        ScheduledTaskId = scheduledTaskId;
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return DueAtUtc;
        yield return Reason;
        yield return ScheduledTaskId;
    }
}
`,

  'src/OpenFlow.Domain/Executions/ExecutionCursor.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Executions;

public class ExecutionCursor : ValueObject
{
    public string CurrentNodeKey { get; }
    public string NextPort { get; }
    public int StepCount { get; }

    public ExecutionCursor(string currentNodeKey, string nextPort, int stepCount)
    {
        CurrentNodeKey = currentNodeKey;
        NextPort = nextPort;
        StepCount = stepCount;
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return CurrentNodeKey;
        yield return NextPort;
        yield return StepCount;
    }
}
`,

  'src/OpenFlow.Domain/Executions/ExecutionStep.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Executions;

public class ExecutionStep : Entity<Guid>
{
    public Guid ExecutionId { get; private set; }
    public string NodeKey { get; private set; } = string.Empty;
    public int Attempt { get; private set; }
    public string InputJson { get; private set; } = "{}";
    public string OutputJson { get; private set; } = "{}";
    public string StateDiffJson { get; private set; } = "{}";
    public ExecutionStatus Status { get; private set; }
    public string? ErrorMessage { get; private set; }
    public DateTime ExecutedAtUtc { get; private set; }
    public long DurationMs { get; private set; }

    private ExecutionStep() { }

    public ExecutionStep(Guid id, Guid executionId, string nodeKey, int attempt, string inputJson, string outputJson, string stateDiffJson, ExecutionStatus status, DateTime executedAtUtc, long durationMs, string? error = null)
        : base(id)
    {
        ExecutionId = executionId;
        NodeKey = nodeKey;
        Attempt = attempt;
        InputJson = inputJson;
        OutputJson = outputJson;
        StateDiffJson = stateDiffJson;
        Status = status;
        ExecutedAtUtc = executedAtUtc;
        DurationMs = durationMs;
        ErrorMessage = error;
    }

    public static ExecutionStep Start(Guid id, Guid executionId, string nodeKey, int attempt, string inputJson, DateTime executedAtUtc)
    {
        return new ExecutionStep(id, executionId, nodeKey, attempt, inputJson, "{}", "{}", ExecutionStatus.Running, executedAtUtc, 0);
    }

    public void Complete(string outputJson, string stateDiffJson, long durationMs)
    {
        OutputJson = outputJson;
        StateDiffJson = stateDiffJson;
        Status = ExecutionStatus.Completed;
        DurationMs = durationMs;
    }

    public void Fail(string error, long durationMs)
    {
        ErrorMessage = error;
        Status = ExecutionStatus.Failed;
        DurationMs = durationMs;
    }
}
`,

  'src/OpenFlow.Domain/Executions/EffectIntent.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Executions;

public class EffectIntent : Entity<Guid>
{
    public Guid ExecutionStepId { get; private set; }
    public string IdempotencyKey { get; private set; } = string.Empty;
    public string Type { get; private set; } = string.Empty;
    public string RequestJson { get; private set; } = "{}";
    public string? FixtureResponseJson { get; private set; }
    public string Status { get; private set; } = "Pending";
    public DateTime CreatedAtUtc { get; private set; }

    private EffectIntent() { }

    public EffectIntent(Guid id, Guid executionStepId, string idempotencyKey, string type, string requestJson, DateTime createdAtUtc, string? fixtureResponseJson = null)
        : base(id)
    {
        ExecutionStepId = executionStepId;
        IdempotencyKey = idempotencyKey;
        Type = type;
        RequestJson = requestJson;
        CreatedAtUtc = createdAtUtc;
        FixtureResponseJson = fixtureResponseJson;
    }

    public void MarkExecuted(string? responseJson = null)
    {
        Status = "Executed";
        if (responseJson != null) FixtureResponseJson = responseJson;
    }
}
`,

  'src/OpenFlow.Domain/Executions/Execution.cs': `using OpenFlow.Domain.Common;

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
`,

  'src/OpenFlow.Domain/Executions/ExecutionState.cs': `namespace OpenFlow.Domain.Executions;

public class ExecutionState
{
    public ContactState Contact { get; set; } = new();
    public Dictionary<string, object?> Variables { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public ExecutionState() { }

    public ExecutionState(ContactState contact, Dictionary<string, object?>? variables = null)
    {
        Contact = contact ?? new ContactState();
        if (variables != null)
        {
            Variables = new Dictionary<string, object?>(variables, StringComparer.OrdinalIgnoreCase);
        }
    }

    public ExecutionState Clone()
    {
        return new ExecutionState(
            Contact.Clone(),
            new Dictionary<string, object?>(Variables, StringComparer.OrdinalIgnoreCase)
        );
    }

    public static StateDiff CalculateDiff(ExecutionState before, ExecutionState after)
    {
        var diff = new StateDiff();

        var beforeTags = new HashSet<string>(before.Contact.Tags, StringComparer.OrdinalIgnoreCase);
        var afterTags = new HashSet<string>(after.Contact.Tags, StringComparer.OrdinalIgnoreCase);

        foreach (var tag in afterTags)
        {
            if (!beforeTags.Contains(tag))
                diff.AddedTags.Add(tag);
        }

        foreach (var tag in beforeTags)
        {
            if (!afterTags.Contains(tag))
                diff.RemovedTags.Add(tag);
        }

        CheckFieldChange(diff.ModifiedFields, "Email", before.Contact.Email, after.Contact.Email);
        CheckFieldChange(diff.ModifiedFields, "FirstName", before.Contact.FirstName, after.Contact.FirstName);
        CheckFieldChange(diff.ModifiedFields, "LastName", before.Contact.LastName, after.Contact.LastName);
        CheckFieldChange(diff.ModifiedFields, "Phone", before.Contact.Phone, after.Contact.Phone);
        CheckFieldChange(diff.ModifiedFields, "Score", before.Contact.Score, after.Contact.Score);

        var allCustomKeys = new HashSet<string>(before.Contact.CustomFields.Keys, StringComparer.OrdinalIgnoreCase);
        allCustomKeys.UnionWith(after.Contact.CustomFields.Keys);

        foreach (var key in allCustomKeys)
        {
            before.Contact.CustomFields.TryGetValue(key, out var oldVal);
            after.Contact.CustomFields.TryGetValue(key, out var newVal);
            CheckFieldChange(diff.ModifiedFields, $"customFields.{key}", oldVal, newVal);
        }

        var allVarKeys = new HashSet<string>(before.Variables.Keys, StringComparer.OrdinalIgnoreCase);
        allVarKeys.UnionWith(after.Variables.Keys);

        foreach (var key in allVarKeys)
        {
            before.Variables.TryGetValue(key, out var oldVal);
            after.Variables.TryGetValue(key, out var newVal);
            if (!Equals(oldVal, newVal))
            {
                diff.ModifiedVariables[key] = new FieldChange(oldVal, newVal);
            }
        }

        return diff;
    }

    private static void CheckFieldChange<T>(Dictionary<string, FieldChange> target, string fieldName, T oldValue, T newValue)
    {
        if (!EqualityComparer<T>.Default.Equals(oldValue, newValue))
        {
            target[fieldName] = new FieldChange(oldValue, newValue);
        }
    }
}

public class ContactState
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public double? Score { get; set; }
    public List<string> Tags { get; set; } = new();
    public Dictionary<string, string> CustomFields { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public ContactState Clone()
    {
        return new ContactState
        {
            Id = Id,
            Email = Email,
            FirstName = FirstName,
            LastName = LastName,
            Phone = Phone,
            Score = Score,
            Tags = new List<string>(Tags),
            CustomFields = new Dictionary<string, string>(CustomFields, StringComparer.OrdinalIgnoreCase)
        };
    }
}

public class StateDiff
{
    public List<string> AddedTags { get; set; } = new();
    public List<string> RemovedTags { get; set; } = new();
    public Dictionary<string, FieldChange> ModifiedFields { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    public Dictionary<string, FieldChange> ModifiedVariables { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public bool HasChanges => AddedTags.Count > 0 || RemovedTags.Count > 0 || ModifiedFields.Count > 0 || ModifiedVariables.Count > 0;
}

public class FieldChange
{
    public object? OldValue { get; set; }
    public object? NewValue { get; set; }

    public FieldChange() { }

    public FieldChange(object? oldValue, object? newValue)
    {
        OldValue = oldValue;
        NewValue = newValue;
    }
}
`,

  'src/OpenFlow.Domain/Simulation/SimulationMode.cs': `namespace OpenFlow.Domain.Simulation;

public enum SimulationMode
{
    StepMode = 1,
    FastSimulation = 2,
    LiveSandbox = 3
}
`,

  'src/OpenFlow.Domain/Simulation/SimulationRun.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Simulation;

public class SimulationRun : AggregateRoot<Guid>
{
    public Guid WorkflowVersionId { get; private set; }
    public SimulationMode Mode { get; private set; }
    public DateTime ClockStartUtc { get; private set; }
    public DateTime CurrentClockUtc { get; private set; }
    public string Status { get; private set; } = "Running";
    public string InitialStateJson { get; private set; } = "{}";
    public string FinalStateJson { get; private set; } = "{}";
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? CompletedAtUtc { get; private set; }

    private SimulationRun() { }

    public SimulationRun(Guid id, Guid workflowVersionId, SimulationMode mode, DateTime clockStartUtc, string initialStateJson, DateTime createdAtUtc)
        : base(id)
    {
        WorkflowVersionId = workflowVersionId;
        Mode = mode;
        ClockStartUtc = clockStartUtc;
        CurrentClockUtc = clockStartUtc;
        InitialStateJson = initialStateJson;
        CreatedAtUtc = createdAtUtc;
    }

    public void AdvanceClock(DateTime newClockUtc) => CurrentClockUtc = newClockUtc;

    public void Complete(string finalStateJson)
    {
        Status = "Completed";
        FinalStateJson = finalStateJson;
    }

    public void Complete(DateTime completedAtUtc, string finalStateJson)
    {
        Status = "Completed";
        CompletedAtUtc = completedAtUtc;
        FinalStateJson = finalStateJson;
    }
}
`,

  'src/OpenFlow.Domain/Scheduling/TaskStatus.cs': `namespace OpenFlow.Domain.Scheduling;

public enum TaskStatus
{
    Pending = 1,
    Claimed = 2,
    Completed = 3,
    Failed = 4,
    Cancelled = 5
}
`,

  'src/OpenFlow.Domain/Scheduling/ScheduledTask.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Scheduling;

public class ScheduledTask : AggregateRoot<Guid>
{
    public Guid ExecutionId { get; private set; }
    public string NodeKey { get; private set; } = string.Empty;
    public DateTime DueAtUtc { get; private set; }
    public TaskStatus Status { get; private set; } = TaskStatus.Pending;
    public string? LeaseOwner { get; private set; }
    public DateTime? LeaseUntilUtc { get; private set; }
    public int Attempts { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    private ScheduledTask() { }

    public ScheduledTask(Guid id, Guid executionId, string nodeKey, DateTime dueAtUtc, DateTime createdAtUtc)
        : base(id)
    {
        ExecutionId = executionId;
        NodeKey = nodeKey;
        DueAtUtc = dueAtUtc;
        CreatedAtUtc = createdAtUtc;
        Status = TaskStatus.Pending;
    }

    public bool Claim(string owner, TimeSpan duration, DateTime utcNow)
    {
        if (Status == TaskStatus.Completed || Status == TaskStatus.Cancelled) return false;
        if (Status == TaskStatus.Claimed && LeaseUntilUtc > utcNow && LeaseOwner != owner) return false;

        LeaseOwner = owner;
        LeaseUntilUtc = utcNow.Add(duration);
        Status = TaskStatus.Claimed;
        Attempts++;
        return true;
    }

    public void Complete() => Status = TaskStatus.Completed;
    public void Reschedule(DateTime nextDueAtUtc)
    {
        DueAtUtc = nextDueAtUtc;
        Status = TaskStatus.Pending;
        LeaseOwner = null;
        LeaseUntilUtc = null;
    }
}
`,

  'src/OpenFlow.Domain/Contacts/Contact.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Contacts;

public class Contact : AggregateRoot<Guid>
{
    public string Email { get; private set; } = string.Empty;
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public List<string> Tags { get; private set; } = new();
    public Dictionary<string, string> CustomFields { get; private set; } = new();
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }

    private Contact() { }

    public Contact(Guid id, string email, string firstName, string lastName, string phone, DateTime createdAtUtc)
        : base(id)
    {
        Email = email;
        FirstName = firstName;
        LastName = lastName;
        Phone = phone;
        CreatedAtUtc = createdAtUtc;
        UpdatedAtUtc = createdAtUtc;
    }

    public void AddTag(string tag)
    {
        if (!Tags.Contains(tag)) Tags.Add(tag);
    }

    public void RemoveTag(string tag) => Tags.Remove(tag);

    public void SetCustomField(string key, string value) => CustomFields[key] = value;
}
`,

  'src/OpenFlow.Domain/Audit/AuditLog.cs': `using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Audit;

public class AuditLog : Entity<Guid>
{
    public string ActorId { get; private set; } = string.Empty;
    public string Action { get; private set; } = string.Empty;
    public string TargetType { get; private set; } = string.Empty;
    public string TargetId { get; private set; } = string.Empty;
    public string ChangesJson { get; private set; } = "{}";
    public DateTime TimestampUtc { get; private set; }

    private AuditLog() { }

    public AuditLog(Guid id, string actorId, string action, string targetType, string targetId, string changesJson, DateTime timestampUtc)
        : base(id)
    {
        ActorId = actorId;
        Action = action;
        TargetType = targetType;
        TargetId = targetId;
        ChangesJson = changesJson;
        TimestampUtc = timestampUtc;
    }
}
`,

};
