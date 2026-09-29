namespace OpenFlow.Domain.Executions;

public class ExecutionState
{
    public ContactState Contact { get; set; } = new();
    public Dictionary<string, object?> Variables { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public ExecutionState() { }

    public ExecutionState(ContactState contact, Dictionary<string, object?>? variables = null)
    {
        Contact = contact ?? new ContactState();
        if (variables != null)
        {
            Variables = new Dictionary<string, object?>(variables, StringComparer.OrdinalIgnoreCase);
        }
    }

    public ExecutionState Clone()
    {
        return new ExecutionState(
            Contact.Clone(),
            new Dictionary<string, object?>(Variables, StringComparer.OrdinalIgnoreCase)
        );
    }

    public static StateDiff CalculateDiff(ExecutionState before, ExecutionState after)
    {
        var diff = new StateDiff();

        var beforeTags = new HashSet<string>(before.Contact.Tags, StringComparer.OrdinalIgnoreCase);
        var afterTags = new HashSet<string>(after.Contact.Tags, StringComparer.OrdinalIgnoreCase);

        foreach (var tag in afterTags)
        {
            if (!beforeTags.Contains(tag))
                diff.AddedTags.Add(tag);
        }

        foreach (var tag in beforeTags)
        {
            if (!afterTags.Contains(tag))
                diff.RemovedTags.Add(tag);
        }

        CheckFieldChange(diff.ModifiedFields, "Email", before.Contact.Email, after.Contact.Email);
        CheckFieldChange(diff.ModifiedFields, "FirstName", before.Contact.FirstName, after.Contact.FirstName);
        CheckFieldChange(diff.ModifiedFields, "LastName", before.Contact.LastName, after.Contact.LastName);
        CheckFieldChange(diff.ModifiedFields, "Phone", before.Contact.Phone, after.Contact.Phone);
        CheckFieldChange(diff.ModifiedFields, "Score", before.Contact.Score, after.Contact.Score);

        var allCustomKeys = new HashSet<string>(before.Contact.CustomFields.Keys, StringComparer.OrdinalIgnoreCase);
        allCustomKeys.UnionWith(after.Contact.CustomFields.Keys);

        foreach (var key in allCustomKeys)
        {
            before.Contact.CustomFields.TryGetValue(key, out var oldVal);
            after.Contact.CustomFields.TryGetValue(key, out var newVal);
            CheckFieldChange(diff.ModifiedFields, $"customFields.{key}", oldVal, newVal);
        }

        var allVarKeys = new HashSet<string>(before.Variables.Keys, StringComparer.OrdinalIgnoreCase);
        allVarKeys.UnionWith(after.Variables.Keys);

        foreach (var key in allVarKeys)
        {
            before.Variables.TryGetValue(key, out var oldVal);
            after.Variables.TryGetValue(key, out var newVal);
            if (!Equals(oldVal, newVal))
            {
                diff.ModifiedVariables[key] = new FieldChange(oldVal, newVal);
            }
        }

        return diff;
    }

    private static void CheckFieldChange<T>(Dictionary<string, FieldChange> target, string fieldName, T oldValue, T newValue)
    {
        if (!EqualityComparer<T>.Default.Equals(oldValue, newValue))
        {
            target[fieldName] = new FieldChange(oldValue, newValue);
        }
    }
}

public class ContactState
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public double? Score { get; set; }
    public List<string> Tags { get; set; } = new();
    public Dictionary<string, string> CustomFields { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public ContactState Clone()
    {
        return new ContactState
        {
            Id = Id,
            Email = Email,
            FirstName = FirstName,
            LastName = LastName,
            Phone = Phone,
            Score = Score,
            Tags = new List<string>(Tags),
            CustomFields = new Dictionary<string, string>(CustomFields, StringComparer.OrdinalIgnoreCase)
        };
    }
}

public class StateDiff
{
    public List<string> AddedTags { get; set; } = new();
    public List<string> RemovedTags { get; set; } = new();
    public Dictionary<string, FieldChange> ModifiedFields { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    public Dictionary<string, FieldChange> ModifiedVariables { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public bool HasChanges => AddedTags.Count > 0 || RemovedTags.Count > 0 || ModifiedFields.Count > 0 || ModifiedVariables.Count > 0;
}

public class FieldChange
{
    public object? OldValue { get; set; }
    public object? NewValue { get; set; }

    public FieldChange() { }

    public FieldChange(object? oldValue, object? newValue)
    {
        OldValue = oldValue;
        NewValue = newValue;
    }
}
