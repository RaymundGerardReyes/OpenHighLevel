namespace OpenFlow.Application.Abstractions;

public interface IUserContext
{
    string? UserId { get; }
    string? TenantId { get; }
    bool IsAuthenticated { get; }
}
