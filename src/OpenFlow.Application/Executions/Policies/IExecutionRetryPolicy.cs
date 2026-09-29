using OpenFlow.Domain.Workflows;

namespace OpenFlow.Application.Executions.Policies;

public interface IExecutionRetryPolicy
{
    bool ShouldRetry(NodeType nodeType, int currentAttempt, Exception? exception);
    TimeSpan GetRetryDelay(NodeType nodeType, int currentAttempt);
}
