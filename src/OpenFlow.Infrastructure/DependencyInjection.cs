using Microsoft.Extensions.DependencyInjection;
using OpenFlow.Application.Abstractions;
using OpenFlow.Application.Executions.Policies;
using OpenFlow.Application.Executions.Services;
using OpenFlow.Application.SimulationRuns.Services;
using OpenFlow.Application.Workflows.Services;
using OpenFlow.Infrastructure.Clock;
using OpenFlow.Infrastructure.Effects;
using OpenFlow.Infrastructure.Persistence;
using OpenFlow.Infrastructure.Scheduling;

namespace OpenFlow.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddOpenFlowInfrastructure(this IServiceCollection services)
    {
        services.AddScoped<IApplicationDbContext, OpenFlowDbContext>();
        services.AddSingleton<ISimulationClock, SystemClock>();
        services.AddScoped<IFixtureRegistry, FixtureRegistry>();
        services.AddScoped<IEffectDispatcher, MockEffectDispatcher>();
        services.AddScoped<IScheduledTaskQueue, PostgresScheduledTaskQueue>();
        services.AddScoped<IExecutionRetryPolicy, DefaultExecutionRetryPolicy>();
        services.AddScoped<IWorkflowGraphValidationService, WorkflowGraphValidationService>();
        services.AddScoped<IConditionEvaluator, ConditionEvaluator>();
        services.AddScoped<IWorkflowExecutionEngine, WorkflowExecutionEngine>();
        services.AddScoped<ISimulationEngine, SimulationEngine>();

        return services;
    }
}
