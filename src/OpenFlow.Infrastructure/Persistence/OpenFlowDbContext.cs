using OpenFlow.Application.Abstractions;
using OpenFlow.Domain.Audit;
using OpenFlow.Domain.Contacts;
using OpenFlow.Domain.Executions;
using OpenFlow.Domain.Scheduling;
using OpenFlow.Domain.Simulation;
using OpenFlow.Domain.Workflows;

namespace OpenFlow.Infrastructure.Persistence;

public class OpenFlowDbContext : IApplicationDbContext
{
    public ICollection<Workflow> Workflows { get; } = new List<Workflow>();
    public ICollection<WorkflowVersion> WorkflowVersions { get; } = new List<WorkflowVersion>();
    public ICollection<WorkflowNode> WorkflowNodes { get; } = new List<WorkflowNode>();
    public ICollection<WorkflowEdge> WorkflowEdges { get; } = new List<WorkflowEdge>();
    public ICollection<Execution> Executions { get; } = new List<Execution>();
    public ICollection<ExecutionStep> ExecutionSteps { get; } = new List<ExecutionStep>();
    public ICollection<ScheduledTask> ScheduledTasks { get; } = new List<ScheduledTask>();
    public ICollection<EffectIntent> EffectIntents { get; } = new List<EffectIntent>();
    public ICollection<Contact> Contacts { get; } = new List<Contact>();
    public ICollection<SimulationRun> SimulationRuns { get; } = new List<SimulationRun>();
    public ICollection<AuditLog> AuditLogs { get; } = new List<AuditLog>();

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(1);
    }
}
