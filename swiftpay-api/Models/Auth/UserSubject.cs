using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Models.Auth;

public class UserSubject
{
    public required Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required UserRole Role { get; set; }
    public required string DeviceId { get; set; }
}
