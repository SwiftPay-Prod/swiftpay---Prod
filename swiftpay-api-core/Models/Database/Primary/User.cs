using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

public class User : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    public UserStatus Status { get; set; } = UserStatus.Active;
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? WhatsApp { get; set; }
    public string Password { get; set; } = null!;

    public bool EmailVerified { get; set; } = false;


    // Two-Factor Authentication
    public bool TwoFactorEnabled { get; set; } = false;
    public string? TwoFactorSecret { get; set; }

    // Login tracking
    public int FailedLoginAttempts { get; set; } = 0;
    public bool IsLockedOut { get; set; } = false;
    public DateTime? LockedOutAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? PasswordChangedAt { get; set; }

    // Last login info for suspicious login detection
    public string? LastLoginIpAddress { get; set; }
    public string? LastLoginUserAgent { get; set; }
    public string? LastLoginLocation { get; set; }
    public bool UserOnboardingCompleted { get; set; } = false;
    public DateTime? UserOnboardingCompletedAt { get; set; }
    public string? UserOnboardingDataJson { get; set; }
    public string? ReferralCode { get; set; }
    public DateTime? ReferralCodeCreatedAt { get; set; }
    public Guid? ReferredByUserId { get; set; }
    public DateTime? ReferredAt { get; set; }
    public int? ReferralDurationMonths { get; set; }
    public int? ReferralCommissionPercentage { get; set; }
    public int? ReferralCommissionWithdrawalIntervalValue { get; set; }
    public ReferralWithdrawalIntervalUnit? ReferralCommissionWithdrawalIntervalUnit { get; set; }
    public long? ReferralCommissionMinWithdrawalAmount { get; set; }
    public long? ReferralCommissionWithdrawalFeeFixed { get; set; }
    public PixKeyType? ReferralPayoutPixKeyType { get; set; }
    public string? ReferralPayoutPixKey { get; set; }
    public Guid? ReferralPayoutPixKeyVerificationId { get; set; }
    public string? ReferralPayoutPixKeyVerificationCodeHash { get; set; }
    public DateTime? ReferralPayoutPixKeyVerificationCodeExpiresAt { get; set; }
    public DateTime? ReferralPayoutPixKeyVerificationCodeRequestedAt { get; set; }
    public int ReferralPayoutPixKeyVerificationCodeFailedAttempts { get; set; } = 0;

    // Profile
    public string? Bio { get; set; }
    public string? SocialLinks { get; set; }
    public Guid? ProfileImageId { get; set; }
    public string? ProfileImageUrl { get; set; }
    public StoredFile? ProfileImage { get; set; }

    public UserRole Role { get; set; } = UserRole.Merchant;
    public string? InactiveReason { get; set; }
    public string? SuspendedReason { get; set; }
    public DateTime? RankingSuspendedUntil { get; set; }
    public string? RankingSuspensionReason { get; set; }
    public bool HasWayneProtocolAccess { get; set; } = false;

    // Achievements & Customization
    public MerchantLevel? SelectedBorderLevel { get; set; }

    public User? ReferredByUser { get; set; }

    // Relationships
    public ICollection<UserAchievement> UserAchievements { get; set; } = [];
    public ICollection<UserSelectedEmblem> SelectedEmblems { get; set; } = [];
    public ICollection<Merchant> Merchants { get; set; } = [];
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
    public ICollection<TrustedDevice> TrustedDevices { get; set; } = [];
    public ICollection<User> ReferredUsers { get; set; } = [];
    public ICollection<ReferralCommissionPayment> ReferralCommissionPayments { get; set; } = [];
    public ICollection<ReferralCommissionWithdrawalRequest> ReferralCommissionWithdrawalRequests { get; set; } = [];
    public ICollection<ReferralCommissionMovement> ReferralCommissionMovementsAsReferrer { get; set; } = [];
    public ICollection<ReferralCommissionMovement> ReferralCommissionMovementsAsReferred { get; set; } = [];
    public ICollection<ReferralCommissionBalance> ReferralCommissionBalances { get; set; } = [];
    public ICollection<ReferralReferredUserSummary> ReferralReferredUserSummariesAsReferrer { get; set; } = [];
    public ICollection<ReferralReferredUserSummary> ReferralReferredUserSummariesAsReferred { get; set; } = [];
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum UserRole
{
    God,
    Admin,
    Merchant,
    Support
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum UserStatus
{
    Active,
    Inactive,
    Suspended,
}