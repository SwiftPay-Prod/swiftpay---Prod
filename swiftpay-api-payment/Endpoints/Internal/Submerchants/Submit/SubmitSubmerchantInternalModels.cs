using FastEndpoints;
using FluentValidation;
using safefy_api_core.Models.Database;

namespace safefy_api_payment.Endpoints.Internal.Submerchants.Submit;

public sealed class SubmitSubmerchantInternalRequest
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
    public IReadOnlyList<SubmitSubmerchantDocumentInput> Documents { get; set; } = [];
    public SubmitSubmerchantAddressInput? Address { get; set; }
    public SubmitSubmerchantBankAccountInput? BankAccount { get; set; }
}

public sealed class SubmitSubmerchantDocumentInput
{
    public string Type { get; set; } = string.Empty;
    public string? Number { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public string? ExpiresAt { get; set; }
}

public sealed class SubmitSubmerchantAddressInput
{
    public string? Street { get; set; }
    public string? Number { get; set; }
    public string? Complement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
}

public sealed class SubmitSubmerchantBankAccountInput
{
    public string? BankCode { get; set; }
    public string? Branch { get; set; }
    public string? AccountNumber { get; set; }
    public string? AccountType { get; set; }
}

public sealed class SubmitSubmerchantInternalRequestValidator : Validator<SubmitSubmerchantInternalRequest>
{
    public SubmitSubmerchantInternalRequestValidator()
    {
        RuleFor(x => x.AcquirerId).NotEmpty();
        RuleFor(x => x.MerchantId).NotEmpty();
        RuleFor(x => x.LegalName).NotEmpty();
        RuleFor(x => x.TradeName)
            .NotEmpty()
            .When(x => !string.IsNullOrWhiteSpace(x.TradeName));
        RuleFor(x => x.DocumentType).NotEmpty();
        RuleFor(x => x.DocumentNumber).NotEmpty();
        RuleForEach(x => x.Documents).ChildRules(doc =>
        {
            doc.RuleFor(x => x.Type).NotEmpty();
            doc.RuleFor(x => x.FileUrl).NotEmpty();
            doc.RuleFor(x => x.FileName).NotEmpty();
            doc.RuleFor(x => x.FileSize).GreaterThan(0);
            doc.RuleFor(x => x.MimeType).NotEmpty();
        });
    }
}

public sealed class SubmitSubmerchantInternalResponse
{
    public bool Success { get; set; }
    public string? ExternalSubmerchantId { get; set; }
    public string? Status { get; set; }
    public string? RejectionReason { get; set; }
    public string? ErrorMessage { get; set; }
}
