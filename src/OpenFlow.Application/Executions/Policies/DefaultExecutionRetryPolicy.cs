using OpenFlow.Domain.Workflows;

namespace OpenFlow.Application.Executions.Policies;

public class DefaultExecutionRetryPolicy : IExecutionRetryPolicy
{
    private const int MaxAttempts = 3;

    public bool ShouldRetry(NodeType nodeType, int currentAttempt, Exception? exception)
    {
        if (currentAttempt >= MaxAttempts) return false;
        return nodeType switch
        {
            NodeType.Webhook => true,
            NodeType.SendMessage => true,
            _ => false
        };
    }

    public TimeSpan GetRetryDelay(NodeType nodeType, int currentAttempt)
    {
        return TimeSpan.FromSeconds(Math.Pow(2, currentAttempt));
    }
}
