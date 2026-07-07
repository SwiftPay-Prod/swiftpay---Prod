using swiftpay_api.Endpoints.Admin.Referrals.ReadListReferrals;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Mappers;

public static class AdminReferralMapper
{
    public static AdminMinimalReferredUser ToMinimalData(AdminReferredUserProjection data) => new()
    {
        Id = data.Id,
        Name = data.Name,
        Email = data.Email,
        Status = data.Status,
        ReferredAt = data.ReferredAt,
        ReferrerUserId = data.ReferrerUserId,
        ReferrerName = data.ReferrerName,
        ReferrerEmail = data.ReferrerEmail,
        EstimatedCommissionFromPayments = data.EstimatedCommissionFromPayments,
        EstimatedCommissionFromPayouts = data.EstimatedCommissionFromPayouts,
        EstimatedCommissionTotal = data.EstimatedCommissionTotal
    };
}

public sealed class AdminReferredUserProjection
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserStatus Status { get; set; }
    public DateTime? ReferredAt { get; set; }
    public Guid ReferrerUserId { get; set; }
    public string ReferrerName { get; set; } = string.Empty;
    public string ReferrerEmail { get; set; } = string.Empty;
    public long EstimatedCommissionFromPayments { get; set; }
    public long EstimatedCommissionFromPayouts { get; set; }
    public long EstimatedCommissionTotal { get; set; }
}
