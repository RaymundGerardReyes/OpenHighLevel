using OpenFlow.Domain.Common;

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
