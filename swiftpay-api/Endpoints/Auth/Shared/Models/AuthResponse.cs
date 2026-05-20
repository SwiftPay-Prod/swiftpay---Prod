using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Auth.Shared.Models;

public class AuthResponse
{
    public UserInfo User { get; set; } = null!;
    public AuthTokens Tokens { get; set; } = null!;
}

public class UserInfo
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public UserRole Role { get; set; }
    public UserStatus Status { get; set; }
    public bool EmailVerified { get; set; }
    public string? SuspendedReason { get; set; }
    public string? InactiveReason { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AuthTokens
{
    public string AccessToken { get; set; } = null!;
    public DateTime AccessTokenExpiresAt { get; set; }
    public string SessionId { get; set; } = null!;
}
