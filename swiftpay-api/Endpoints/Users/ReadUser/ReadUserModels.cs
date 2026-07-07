using System.Text.Json.Serialization;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Users.ReadUser;

public class ReadUserResponse : BaseResponse<UserDetails>;

public class UserDetails
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public UserRole Role { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public UserStatus Status { get; set; }

    public bool EmailVerified { get; set; }

    public string? Bio { get; set; }
    public string? SocialLinks { get; set; }
    public string? ProfileImageUrl { get; set; }

    public string? InactiveReason { get; set; }
    public string? SuspendedReason { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
