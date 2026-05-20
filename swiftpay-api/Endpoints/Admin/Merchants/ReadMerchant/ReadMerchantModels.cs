using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Merchants.ReadMerchant;

public sealed class ReadMerchantRequest
{
    public Guid Id { get; set; }
}

public sealed class ReadMerchantValidator : Validator<ReadMerchantRequest>
{
    public ReadMerchantValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");
    }
}

public sealed class ReadMerchantResponse : BaseResponse<AdminMerchantData>;

public sealed class AdminMerchantData
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? WhatsApp { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantStatus Status { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantKycStatus KycStatus { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantOnboardingStep OnboardingStep { get; set; }

    public AdminMerchantUserData User { get; set; } = null!;
    public AdminMerchantAddressData? Address { get; set; }
    public AdminMerchantKycData? Kyc { get; set; }
    public AdminMerchantAcquirerData? Acquirer { get; set; }
    public List<AdminMerchantKycPendingItemData> KycPendingItems { get; set; } = [];

    public DateTime CreatedAt { get; set; }
    public DateTime? OnboardingCompletedAt { get; set; }
    public DateTime? KycSubmittedAt { get; set; }
    public DateTime? KycApprovedAt { get; set; }
    public string? SuspendedReason { get; set; }
    public string? InactiveReason { get; set; }
}

public sealed class AdminMerchantUserData
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public UserStatus Status { get; set; }

    public DateTime CreatedAt { get; set; }
}

public sealed class AdminMerchantAddressData
{
    public string? Street { get; set; }
    public string? Number { get; set; }
    public string? Complement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
}

public sealed class AdminMerchantKycData
{
    public string? LegalName { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantKycDocumentType? DocumentType { get; set; }

    public string? DocumentNumber { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantIdentityDocumentType? IdentityDocumentType { get; set; }

    public string? IdentityDocumentNumber { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantKycOperationType? OperationType { get; set; }

    public string? BusinessDescription { get; set; }
    public string? Website { get; set; }
    public decimal? ExpectedMonthlyVolume { get; set; }
    public decimal? MonthlyRevenue { get; set; }
    public decimal? AverageTicket { get; set; }
    public bool UsesPix { get; set; }
    public bool UsesBoleto { get; set; }
    public bool UsesCreditCard { get; set; }
    public string? RejectionReason { get; set; }
    public string? AdminNotes { get; set; }

    public FileData? ProofOfAddress { get; set; }
    public FileData? DocumentFront { get; set; }
    public FileData? DocumentBack { get; set; }
    public FileData? Selfie { get; set; }
    public FileData? CnpjCard { get; set; }
    public FileData? CompanyContract { get; set; }
}

public sealed class AdminMerchantAcquirerData
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? DisplayName { get; set; }
    public string Code { get; set; } = null!;
    public string? Nominal { get; set; }
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; }
    public DateTime AssignedAt { get; set; }
    public bool UsesSubaccount { get; set; }
    public string? ExternalSubmerchantId { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ExternalSubmerchantStatus? ExternalSubmerchantStatus { get; set; }

    public DateTime? ExternalOnboardingSubmittedAt { get; set; }
    public DateTime? ExternalOnboardingCompletedAt { get; set; }
    public string? ExternalOnboardingRejectionReason { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode PixInFeeMode { get; set; }
    public long PixInFeeFixed { get; set; }
    public int PixInFeePercentage { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode BoletoInFeeMode { get; set; }
    public long BoletoInFeeFixed { get; set; }
    public int BoletoInFeePercentage { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode CreditCardInFeeMode { get; set; }
    public long CreditCardInFeeFixed { get; set; }
    public int CreditCardInFeePercentage { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode PayoutFeeMode { get; set; }
    public long PayoutFeeFixed { get; set; }
    public int PayoutFeePercentage { get; set; }
}

public sealed class AdminMerchantKycPendingItemData
{
    public Guid Id { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantKycPendingItemType Type { get; set; }

    public string Title { get; set; } = null!;
    public string? Description { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantKycPendingField? FieldKey { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantKycPendingItemStatus Status { get; set; }

    public string? Response { get; set; }
    public DateTime? RespondedAt { get; set; }
    public DateTime? EvaluatedAt { get; set; }
    public string? AdminNotes { get; set; }
    public DateTime CreatedAt { get; set; }
}
