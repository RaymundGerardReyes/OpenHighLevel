using OpenFlow.Domain.Common;

namespace OpenFlow.Domain.Contacts;

public class Contact : AggregateRoot<Guid>
{
    public string Email { get; private set; } = string.Empty;
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public List<string> Tags { get; private set; } = new();
    public Dictionary<string, string> CustomFields { get; private set; } = new();
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }

    private Contact() { }

    public Contact(Guid id, string email, string firstName, string lastName, string phone, DateTime createdAtUtc)
        : base(id)
    {
        Email = email;
        FirstName = firstName;
        LastName = lastName;
        Phone = phone;
        CreatedAtUtc = createdAtUtc;
        UpdatedAtUtc = createdAtUtc;
    }

    public void AddTag(string tag)
    {
        if (!Tags.Contains(tag)) Tags.Add(tag);
    }

    public void RemoveTag(string tag) => Tags.Remove(tag);

    public void SetCustomField(string key, string value) => CustomFields[key] = value;
}
