using swiftpay_api.Endpoints.Admin.Users.ReadListUsers;
using swiftpay_api.Endpoints.Admin.Users.ReadUser;
using swiftpay_api.Endpoints.Auth.Shared.Models;
using swiftpay_api.Endpoints.Users.ReadUser;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Mappers;

public static class UserMapper
{
    public static UserInfo ToUserInfo(User user) => new()
    {
        Id = user.Id,
        Name = user.Name,
        Email = user.Email,
        Role = user.Role,
        Status = user.Status,
        EmailVerified = user.EmailVerified,
        SuspendedReason = user.SuspendedReason,
        InactiveReason = user.InactiveReason,
        CreatedAt = user.CreatedAt
    };

    public static UserDetails ToUserDetails(User user) => new()
    {
        Id = user.Id,
        Name = user.Name,
        Email = user.Email,
        Role = user.Role,
        Status = user.Status,
        EmailVerified = user.EmailVerified,
        Bio = user.Bio,
        SocialLinks = user.SocialLinks,
        ProfileImageUrl = user.ProfileImageUrl,
        InactiveReason = user.InactiveReason,
        SuspendedReason = user.SuspendedReason,
        CreatedAt = user.CreatedAt,
        UpdatedAt = user.UpdatedAt
    };

    public static AdminUserDetails ToAdminUserDetails(
        User user,
        List<AdminMerchantSummary> merchants,
        AdminReferralCommissionSummaryData referralCommission,
        AdminUserOnboardingData onboarding) => new()
    {
        Id = user.Id,
        Name = user.Name,
        Email = user.Email,
        Role = user.Role,
        Status = user.Status,
        EmailVerified = user.EmailVerified,
        TwoFactorEnabled = user.TwoFactorEnabled,
        IsLockedOut = user.IsLockedOut,
        FailedLoginAttempts = user.FailedLoginAttempts,
        InactiveReason = user.InactiveReason,
        SuspendedReason = user.SuspendedReason,
        LastLoginAt = user.LastLoginAt,
        LastLoginIpAddress = user.LastLoginIpAddress,
        LastLoginUserAgent = user.LastLoginUserAgent,
        LastLoginLocation = user.LastLoginLocation,
        LockedOutAt = user.LockedOutAt,
        PasswordChangedAt = user.PasswordChangedAt,
        ReferredByUserId = user.ReferredByUserId,
        ReferredByUserName = user.ReferredByUser?.Name,
        ReferredByUserEmail = user.ReferredByUser?.Email,
        ReferredAt = user.ReferredAt,
        ReferralDurationMonths = user.ReferralDurationMonths,
        ReferralCommissionPercentage = user.ReferralCommissionPercentage,
        ReferralCommissionWithdrawalIntervalValue = user.ReferralCommissionWithdrawalIntervalValue,
        ReferralCommissionWithdrawalIntervalUnit = user.ReferralCommissionWithdrawalIntervalUnit,
        ReferralCommissionMinWithdrawalAmount = user.ReferralCommissionMinWithdrawalAmount,
        ReferralCommissionWithdrawalFeeFixed = user.ReferralCommissionWithdrawalFeeFixed,
        ReferralPayoutPixKeyType = user.ReferralPayoutPixKeyType,
        ReferralPayoutPixKey = user.ReferralPayoutPixKey,
        ReferralCommission = referralCommission,
        Onboarding = onboarding,
        HasWayneProtocolAccess = user.HasWayneProtocolAccess,
        CreatedAt = user.CreatedAt,
        UpdatedAt = user.UpdatedAt,
        Merchants = merchants
    };

    public static AdminMerchantSummary ToAdminMerchantSummary(Merchant merchant) => new()
    {
        Id = merchant.Id,
        Name = merchant.Name,
        Document = merchant.MerchantKyc?.DocumentNumber,
        Status = merchant.Status,
        TotalRevenue = merchant.Payments
            .Where(p => p.Status == PaymentStatus.Completed)
            .Sum(p => p.NetAmount)
    };

    public static AdminMinimalUser ToAdminMinimalUser(
        User user,
        int referredUsersCount,
        long availableCommissionBalance,
        long generatedReferralCommission) => new()
    {
        Id = user.Id,
        Name = user.Name,
        Email = user.Email,
        WhatsApp = user.WhatsApp,
        Status = user.Status,
        Role = user.Role,
        EmailVerified = user.EmailVerified,
        MerchantCount = user.Merchants.Count(m => m.Status != MerchantStatus.Deleted),
        ReferredUsersCount = referredUsersCount,
        AvailableCommissionBalance = availableCommissionBalance,
        WasReferred = user.ReferredByUserId.HasValue,
        ReferredAt = user.ReferredAt,
        GeneratedReferralCommission = generatedReferralCommission,
        CreatedAt = user.CreatedAt,
        LastLoginAt = user.LastLoginAt,
        RankingSuspendedUntil = user.RankingSuspendedUntil,
        RankingSuspensionReason = user.RankingSuspensionReason
    };
}
