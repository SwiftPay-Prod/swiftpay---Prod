using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Database;

public class Merchant : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public MerchantStatus Status { get; set; } = MerchantStatus.Draft;
    public MerchantKycStatus KycStatus { get; set; } = MerchantKycStatus.Draft;
    public MerchantOnboardingStep OnboardingStep { get; set; } = MerchantOnboardingStep.BasicInfo;

    // Basic Info (Step 1)
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? WhatsApp { get; set; }

    // Address (Step 2)
    public string? Address { get; set; }
    public string? AddressNumber { get; set; }
    public string? AddressComplement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }

    // Status reasons
    public string? InactiveReason { get; set; }
    public string? SuspendedReason { get; set; }
    public string? DeletedReason { get; set; }

    // Deletion tracking
    public DateTime? DeletedAt { get; set; }

    // Onboarding tracking
    public DateTime? OnboardingCompletedAt { get; set; }
    public DateTime? KycSubmittedAt { get; set; }
    public DateTime? KycApprovedAt { get; set; }
    public DateTime? KycRejectedAt { get; set; }

    // Relationships
    public User User { get; set; } = null!;
    public MerchantKyc? MerchantKyc { get; set; }
    public MerchantSettings? MerchantSettings { get; set; }
    public MerchantEmailSettings? EmailSettings { get; set; }
    public ICollection<MerchantApiCredential> MerchantApiCredentials { get; set; } = [];
    public ICollection<MerchantKycPendingItem> MerchantKycPendingItems { get; set; } = [];
    public ICollection<MerchantAcquirer> MerchantAcquirers { get; set; } = [];
    public ICollection<Account> Accounts { get; set; } = [];
    public ICollection<Payment> Payments { get; set; } = [];
    public ICollection<PaymentLink> PaymentLinks { get; set; } = [];
    public ICollection<Payout> Payouts { get; set; } = [];
    public ICollection<Order> Orders { get; set; } = [];
    public ICollection<Checkout> Checkouts { get; set; } = [];
    public ICollection<Product> Products { get; set; } = [];
    public ICollection<MerchantPayoutAccount> PayoutAccounts { get; set; } = [];
    public ICollection<Notification> Notifications { get; set; } = [];
    public ICollection<MerchantEmailTemplate> EmailTemplates { get; set; } = [];
    public ICollection<MerchantNominalAbTest> NominalAbTests { get; set; } = [];
    public ICollection<MerchantIntegration> MerchantIntegrations { get; set; } = [];
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MerchantStatus
{
    Draft,
    Active,
    Inactive,
    Suspended,
    Deleted
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MerchantKycStatus
{
    Draft,
    Pending,
    UnderReview,
    Approved,
    Rejected,
    Complement
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MerchantOnboardingStep
{
    BasicInfo,
    Address,
    Documents,
    Billing,
    Review,
    Completed
}