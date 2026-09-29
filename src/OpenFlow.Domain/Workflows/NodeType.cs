namespace OpenFlow.Domain.Workflows;

public enum NodeType
{
    Trigger = 1,
    SetContactField = 2,
    AddTag = 3,
    RemoveTag = 4,
    IfElse = 5,
    WaitDuration = 6,
    SendMessage = 7,
    Webhook = 8,
    Goal = 9,
    End = 10
}
