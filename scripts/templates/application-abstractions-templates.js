// scripts/templates/application-abstractions-templates.js
// Core abstractions and interfaces for OpenFlow.Application

export const applicationAbstractionsTemplates = {
  'src/OpenFlow.Application/Abstractions/ICommand.cs': `namespace OpenFlow.Application.Abstractions;

public interface ICommand<out TResult>
{
}

public interface ICommandHandler<in TCommand, TResult> where TCommand : ICommand<TResult>
{
    Task<TResult> HandleAsync(TCommand command, CancellationToken cancellationToken = default);
}
`,

  'src/OpenFlow.Application/Abstractions/IQuery.cs': `namespace OpenFlow.Application.Abstractions;

public interface IQuery<out TResult>
{
}

public interface IQueryHandler<in TQuery, TResult> where TQuery : IQuery<TResult>
{
    Task<TResult> HandleAsync(TQuery query, CancellationToken cancellationToken = default);
}
`,

  'src/OpenFlow.Application/Abstractions/ISimulationClock.cs': `namespace OpenFlow.Application.Abstractions;

public interface ISimulationClock
{
    DateTime UtcNow { get; }
    void AdvanceBy(TimeSpan duration);
    void SetTime(DateTime utcTime);
}
`,

  'src/OpenFlow.Application/Abstractions/IUserContext.cs': `namespace OpenFlow.Application.Abstractions;

public interface IUserContext
{
    string? UserId { get; }
    string? TenantId { get; }
    bool IsAuthenticated { get; }
}
`,

  'src/OpenFlow.Application/Abstractions/IEffectDispatcher.cs': `using OpenFlow.Domain.Executions;

namespace OpenFlow.Application.Abstractions;

public interface IEffectDispatcher
{
    Task<string> DispatchAsync(EffectIntent intent, CancellationToken cancellationToken = default);
}
`,

  'src/OpenFlow.Application/Abstractions/IApplicationDbContext.cs': `using OpenFlow.Domain.Workflows;
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
`,
};
