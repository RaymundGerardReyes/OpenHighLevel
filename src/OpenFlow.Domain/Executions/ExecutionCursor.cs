using OpenFlow.Domain.Common;

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
