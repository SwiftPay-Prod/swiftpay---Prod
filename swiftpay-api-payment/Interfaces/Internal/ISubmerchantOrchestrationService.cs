using safefy_api_core.Models.Database;

namespace safefy_api_payment.Interfaces.Internal;

public interface ISubmerchantOrchestrationService
{
    Task<SubmerchantSubmitResult> SubmitAsync(
        AcquirerConfigResult acquirerConfig,
        SubmerchantSubmitInput input,
        CancellationToken ct = default);

    Task<SubmerchantStatusResult> GetStatusAsync(
        AcquirerConfigResult acquirerConfig,
        string externalSubmerchantId,
        CancellationToken ct = default);

    Task<SubmerchantSplitConfigResult> SyncSplitConfigAsync(
        AcquirerConfigResult acquirerConfig,
        SubmerchantSplitConfigInput input,
        CancellationToken ct = default);
}

public sealed class SubmerchantSubmitInput
{
    public string? ExistingExternalSubmerchantId { get; set; }
    public string LegalName { get; set; } = string.Empty;
    public string? TradeName { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string DocumentNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? BusinessDescription { get; set; }
    public string? Website { get; set; }
    public IReadOnlyList<SubmerchantDocumentInput> Documents { get; set; } = [];
    public SubmerchantAddressInput? Address { get; set; }
    public SubmerchantBankAccountInput? BankAccount { get; set; }
}

public sealed class SubmerchantDocumentInput
{
    public string Type { get; set; } = string.Empty;
    public string? Number { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public string? ExpiresAt { get; set; }
}

public sealed class SubmerchantAddressInput
{
    public string? Street { get; set; }
    public string? Number { get; set; }
    public string? Complement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
}

public sealed class SubmerchantBankAccountInput
{
    public string? BankCode { get; set; }
    public string? Branch { get; set; }
    public string? AccountNumber { get; set; }
    public string? AccountType { get; set; }
}

public sealed class SubmerchantSplitConfigInput
{
    public string ExternalSubmerchantId { get; set; } = string.Empty;
    public string CommissionType { get; set; } = string.Empty;
    public decimal CommissionValue { get; set; }
    public bool IsActive { get; set; }
}

public sealed class SubmerchantSubmitResult
{
    public bool Success { get; set; }
    public string? ExternalSubmerchantId { get; set; }
    public string? Status { get; set; }
    public string? RejectionReason { get; set; }
    public string? ErrorMessage { get; set; }
}

public sealed class SubmerchantStatusResult
{
    public bool Success { get; set; }
    public string? ExternalSubmerchantId { get; set; }
    public string? Status { get; set; }
    public string? LegalName { get; set; }
    public string? DocumentType { get; set; }
    public string? DocumentNumber { get; set; }
    public string? CreatedAt { get; set; }
    public string? UpdatedAt { get; set; }
    public string? RejectionReason { get; set; }
    public string? ErrorMessage { get; set; }
}

public sealed class SubmerchantSplitConfigResult
{
    public bool Success { get; set; }
    public string? ExternalSubmerchantId { get; set; }
    public string? CommissionType { get; set; }
    public decimal? CommissionValue { get; set; }
    public bool? IsActive { get; set; }
    public string? ErrorMessage { get; set; }
}
