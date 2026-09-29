using OpenFlow.Domain.Workflows;
using OpenFlow.Domain.Executions;
using OpenFlow.Domain.Contacts;
using OpenFlow.Domain.Scheduling;
using OpenFlow.Domain.Simulation;
using OpenFlow.Domain.Audit;

namespace OpenFlow.Application.Abstractions;

public interface IApplicationDbContext
{
    ICollection<Workflow> Workflows { get; }
    ICollection<WorkflowVersion> WorkflowVersions { get; }
    ICollection<WorkflowNode> WorkflowNodes { get; }
    ICollection<WorkflowEdge> WorkflowEdges { get; }
    ICollection<Execution> Executions { get; }
    ICollection<ExecutionStep> ExecutionSteps { get; }
    ICollection<ScheduledTask> ScheduledTasks { get; }
    ICollection<EffectIntent> EffectIntents { get; }
    ICollection<Contact> Contacts { get; }
    ICollection<SimulationRun> SimulationRuns { get; }
    ICollection<AuditLog> AuditLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
