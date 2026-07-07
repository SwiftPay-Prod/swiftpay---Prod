using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.Merchants.ReadPaymentLedger;

public sealed class AdminReadPaymentLedgerRequest
{
    public Guid MerchantId { get; set; }
    public Guid PaymentId { get; set; }
}

public sealed class AdminReadPaymentLedgerValidator : Validator<AdminReadPaymentLedgerRequest>
{
    public AdminReadPaymentLedgerValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.PaymentId)
            .NotEmpty()
            .WithMessage("O identificador do pagamento é obrigatório.");
    }
}

public sealed class AdminReadPaymentLedgerResponse : BaseResponse<AdminPaymentLedgerData>;

public sealed class AdminPaymentLedgerData
{
    public Guid PaymentId { get; set; }
    public long Amount { get; set; }
    public long PlatformFee { get; set; }
    public long AcquirerFee { get; set; }
    public long NetAmount { get; set; }
    public long Profit { get; set; }
    public List<AdminLedgerEntryData> Entries { get; set; } = [];
}

public sealed class AdminLedgerEntryData
{
    public string Id { get; set; } = null!;
    public string TransactionId { get; set; } = null!;
    public LedgerEntryType Type { get; set; }
    public long Amount { get; set; }
    public DateTime Timestamp { get; set; }
    public string Description { get; set; } = null!;
    public AdminLedgerAccountData Account { get; set; } = null!;
}

public sealed class AdminLedgerAccountData
{
    public Guid Id { get; set; }
    public AccountType Type { get; set; }
}
