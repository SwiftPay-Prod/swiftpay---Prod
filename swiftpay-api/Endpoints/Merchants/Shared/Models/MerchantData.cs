using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Merchants.Shared.Models;

public sealed class MerchantData
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? WhatsApp { get; set; }
    public string Status { get; set; } = null!;
    public string KycStatus { get; set; } = null!;
    public string OnboardingStep { get; set; } = null!;
    public string? SuspendedReason { get; set; }
    public string? InactiveReason { get; set; }
    public AddressData? Address { get; set; }
    public MerchantKycData? Kyc { get; set; }
    public MerchantFeesData? Fees { get; set; }
    public List<MerchantKycPendingItemData> KycPendingItems { get; set; } = [];
    public DateTime CreatedAt { get; set; }
    public DateTime? OnboardingCompletedAt { get; set; }
}

public sealed class AddressData
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

public sealed class MerchantKycData
{
    public string? LegalName { get; set; }
    public string? DocumentType { get; set; }
    public string? DocumentNumber { get; set; }
    public string? IdentityDocumentType { get; set; }
    public string? IdentityDocumentNumber { get; set; }
    public string? OperationType { get; set; }
    public string? BusinessDescription { get; set; }
    public string? Website { get; set; }
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

public sealed class MerchantKycPendingItemData
{
    public Guid Id { get; set; }
    public string Type { get; set; } = null!;
    public string? FieldKey { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string Status { get; set; } = null!;
    public string? Response { get; set; }
    public DateTime? RespondedAt { get; set; }
    public DateTime? EvaluatedAt { get; set; }
    public string? AdminNotes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class MerchantFeesData
{
    public FeeChargeMode PixApiFeeMode { get; set; }
    public long PixApiFeeFixed { get; set; }
    public int PixApiFeePercentage { get; set; }

    public FeeChargeMode PixCheckoutFeeMode { get; set; }
    public long PixCheckoutFeeFixed { get; set; }
    public int PixCheckoutFeePercentage { get; set; }

    public FeeChargeMode WithdrawalFeeMode { get; set; }
    public long WithdrawalFeeFixed { get; set; }
    public int WithdrawalFeePercentage { get; set; }
    public long MinWithdrawalAmount { get; set; }
}
