using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace safefy_api_core.Models.Database;

public class SecurityLogEntry
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid? UserId { get; set; }

    public string? UserEmail { get; set; }

    [Required]
    public SecurityLogAction Action { get; set; }

    [Required]
    public SecurityLogStatus Status { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public string? Location { get; set; }

    public string? Details { get; set; }

    public string? ServiceName { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum SecurityLogAction
{
    SignIn,
    SignUp,
    SignOut,
    PasswordResetRequest,
    PasswordResetComplete,
    PasswordChange,
    TwoFactorEnable,
    TwoFactorDisable,
    TwoFactorVerify,
    RefreshToken,
    RevokeToken,
    RevokeAllTokens,
    AccountLocked,
    AccountUnlocked,
    EmailChange,
    EmailConfirmationRequest,
    EmailConfirmationComplete,
    ProfileUpdate,
    SuspiciousLogin,
    MerchantCreated,
    MerchantUpdated,
    MerchantDeleted,
    MerchantStatusChange,
    MerchantOnboardingCompleted,
    MerchantKycSubmitted,
    MerchantKycApproved,
    MerchantKycRejected,
    MerchantKycComplement,
    FileUploaded,
    FileDeleted,
    PlatformSettingsUpdated,
    PayoutAccountCreated,
    PayoutAccountVerified,
    PayoutAccountDeleted,
    PayoutAccountSetDefault,
    PayoutRequested,
    PayoutApproved,
    PayoutRejected,
    PayoutCancelled,
    PayoutCompleted,
    PayoutFailed,
    DeviceVerified,
    DeviceRevoked,
    DeviceVerificationCodeResent
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum SecurityLogStatus
{
    Success,
    Failed,
    Warning
}
