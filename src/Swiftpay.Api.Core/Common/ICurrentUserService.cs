namespace Swiftpay.Application.Common;

public interface ICurrentUserService
{
    Guid UserId { get; }
    Guid CompanyId { get; }
    string Email { get; }
    string Role { get; }
}
