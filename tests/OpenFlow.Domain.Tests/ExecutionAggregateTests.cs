using OpenFlow.Domain.Executions;

namespace OpenFlow.Domain.Tests;

public class ExecutionAggregateTests
{
    [Fact]
    public void Execution_ShouldFollowLifecycleTransitions()
    {
        var execution = new Execution(Guid.NewGuid(), Guid.NewGuid(), null, "contact_123", "trigger_node", "{}", DateTime.UtcNow);
        Assert.Equal(ExecutionStatus.Pending, execution.Status);

        execution.Start();
        Assert.Equal(ExecutionStatus.Running, execution.Status);

        var waitState = new WaitState(DateTime.UtcNow.AddMinutes(5), "Timer", Guid.NewGuid());
        execution.SetWaiting(waitState);
        Assert.Equal(ExecutionStatus.Waiting, execution.Status);
        Assert.NotNull(execution.CurrentWaitState);

        execution.MoveToNode("action_node", "{\"updated\":true}");
        Assert.Equal(ExecutionStatus.Running, execution.Status);
        Assert.Null(execution.CurrentWaitState);

        execution.Complete(DateTime.UtcNow);
        Assert.Equal(ExecutionStatus.Completed, execution.Status);
        Assert.NotNull(execution.CompletedAtUtc);
    }
}
