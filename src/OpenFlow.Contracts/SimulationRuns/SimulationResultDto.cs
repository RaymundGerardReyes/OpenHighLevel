using OpenFlow.Contracts.Executions;

namespace OpenFlow.Contracts.SimulationRuns;

public class SimulationResultDto
{
    public Guid SimulationRunId { get; set; }
    public Guid ExecutionId { get; set; }
    public Guid WorkflowVersionId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Mode { get; set; } = string.Empty;
    public DateTime ClockStartUtc { get; set; }
    public DateTime CurrentClockUtc { get; set; }
    public TimeSpan TotalSimulatedDuration { get; set; }
    public string FinalStateJson { get; set; } = "{}";
    public List<ExecutionStepDto> StepTraces { get; set; } = new();
    public List<SimulationResumptionDto> ScheduledResumptions { get; set; } = new();
    public List<SimulationEffectDto> EmittedEffects { get; set; } = new();
}

public class SimulationResumptionDto
{
    public Guid TaskId { get; set; }
    public string NodeKey { get; set; } = string.Empty;
    public DateTime DueAtUtc { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class SimulationEffectDto
{
    public Guid IntentId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string IdempotencyKey { get; set; } = string.Empty;
    public string RequestJson { get; set; } = "{}";
    public string? ResponseJson { get; set; }
    public string Status { get; set; } = string.Empty;
}
