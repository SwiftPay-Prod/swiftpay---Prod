namespace swiftpay_api.Models.PaymentApi;

public sealed class SubmitSubmerchantApiInput
{
    public Guid AcquirerId { get; set; }
    public Guid MerchantId { get; set; }
    public string? ExistingExternalSubmerchantId { get; set; }
    public string LegalName { get; set; } = string.Empty;
    public string? TradeName { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string DocumentNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? BusinessDescription { get; set; }
    public string? Website { get; set; }
    public IReadOnlyList<SubmitSubmerchantDocumentApiInput> Documents { get; set; } = [];
    public SubmitSubmerchantAddressApiInput? Address { get; set; }
    public SubmitSubmerchantBankAccountApiInput? BankAccount { get; set; }
}

public sealed class SubmitSubmerchantDocumentApiInput
{
    public string Type { get; set; } = string.Empty;
    public string? Number { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public string? ExpiresAt { get; set; }
}

public sealed class SubmitSubmerchantAddressApiInput
{
    public string? Street { get; set; }
    public string? Number { get; set; }
    public string? Complement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
}

public sealed class SubmitSubmerchantBankAccountApiInput
{
    public string? BankCode { get; set; }
    public string? Branch { get; set; }
    public string? AccountNumber { get; set; }
    public string? AccountType { get; set; }
}

public sealed class SubmitSubmerchantApiResult
{
    public bool Success { get; set; }
    public string? ExternalSubmerchantId { get; set; }
    public string? Status { get; set; }
    public string? RejectionReason { get; set; }
    public string? ErrorMessage { get; set; }
}

public sealed class GetSubmerchantStatusApiInput
{
    public Guid AcquirerId { get; set; }
    public string ExternalSubmerchantId { get; set; } = string.Empty;
}

public sealed class GetSubmerchantStatusApiResult
{
    public bool Success { get; set; }
    public string? ExternalSubmerchantId { get; set; }
    public string? Status { get; set; }
    public string? LegalName { get; set; }
    public string? DocumentType { get; set; }
    public string? DocumentNumber { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? RejectionReason { get; set; }
    public string? ErrorMessage { get; set; }
}

public sealed class SyncSubmerchantSplitConfigApiInput
{
    public Guid AcquirerId { get; set; }
    public Guid MerchantId { get; set; }
    public string ExternalSubmerchantId { get; set; } = string.Empty;
    public string CommissionType { get; set; } = string.Empty;
    public decimal CommissionValue { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class SyncSubmerchantSplitConfigApiResult
{
    public bool Success { get; set; }
    public string? ExternalSubmerchantId { get; set; }
    public string? CommissionType { get; set; }
    public decimal? CommissionValue { get; set; }
    public bool? IsActive { get; set; }
    public string? ErrorMessage { get; set; }
}

internal sealed class PaymentApiSubmitSubmerchantResponse
{
    public bool Success { get; set; }
    public string? ExternalSubmerchantId { get; set; }
    public string? Status { get; set; }
    public string? RejectionReason { get; set; }
    public string? ErrorMessage { get; set; }
}

internal sealed class PaymentApiGetSubmerchantStatusResponse
{
    public bool Success { get; set; }
    public string? ExternalSubmerchantId { get; set; }
    public string? Status { get; set; }
    public string? LegalName { get; set; }
    public string? DocumentType { get; set; }
    public string? DocumentNumber { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? RejectionReason { get; set; }
    public string? ErrorMessage { get; set; }
}

internal sealed class PaymentApiSyncSubmerchantSplitConfigResponse
{
    public bool Success { get; set; }
    public string? ExternalSubmerchantId { get; set; }
    public string? CommissionType { get; set; }
    public decimal? CommissionValue { get; set; }
    public bool? IsActive { get; set; }
    public string? ErrorMessage { get; set; }
}
