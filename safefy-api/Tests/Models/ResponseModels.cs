namespace safefy_api.Tests.Models;

public class BaseResponse<T>
{
    public T? Data { get; set; }
    public string? Message { get; set; }
    public ErrorResponse? Error { get; set; }
}

public class ErrorResponse
{
    public string? Message { get; set; }
}

public class AuthResponse : BaseResponse<AuthData> { }

public class AuthData
{
    public UserInfo? User { get; set; }
    public AuthTokens? Tokens { get; set; }
}

public class UserInfo
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Role { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AuthTokens
{
    public string? AccessToken { get; set; }
    public DateTime AccessTokenExpiresAt { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime RefreshTokenExpiresAt { get; set; }
}

public class MerchantResponse : BaseResponse<MerchantData> { }

public class MerchantData
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Status { get; set; }
    public string? KycStatus { get; set; }
    public string? OnboardingStep { get; set; }
}

public class ApiCredentialResponse : BaseResponse<ApiCredentialData> { }

public class ApiCredentialData
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? ClientId { get; set; }
    public string? ClientSecret { get; set; }
    public string? Environment { get; set; }
    public string? AllowedIpRange { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ApiCredentialListResponse : BaseResponse<PaginatedData<ApiCredentialData>> { }

public class PaginatedData<T>
{
    public List<T>? Items { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}
