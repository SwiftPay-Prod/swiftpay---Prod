using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.Transactions.ReadTransactionLedger;

public sealed class AdminReadTransactionLedgerRequest
{
    public Guid TransactionId { get; set; }
}

public sealed class AdminReadTransactionLedgerValidator : Validator<AdminReadTransactionLedgerRequest>
{
    public AdminReadTransactionLedgerValidator()
    {
        RuleFor(x => x.TransactionId)
            .NotEmpty()
            .WithMessage("O identificador da transação é obrigatório.");
    }
}

public sealed class AdminReadTransactionLedgerResponse : BaseResponse<AdminTransactionLedgerData>;

public sealed class AdminTransactionLedgerData
{
    public Guid PaymentId { get; set; }
    public Guid MerchantId { get; set; }
    public string? MerchantName { get; set; }
    public long Amount { get; set; }
    public long PlatformFee { get; set; }
    public long AcquirerFee { get; set; }
    public long NetAmount { get; set; }
    public long Profit { get; set; }
    public List<AdminTransactionLedgerEntryData> Entries { get; set; } = [];
}

public sealed class AdminTransactionLedgerEntryData
{
    public string Id { get; set; } = null!;
    public string TransactionId { get; set; } = null!;
    public LedgerEntryType Type { get; set; }
    public long Amount { get; set; }
    public DateTime Timestamp { get; set; }
    public string Description { get; set; } = null!;
    public AdminTransactionLedgerAccountData Account { get; set; } = null!;
}

public sealed class AdminTransactionLedgerAccountData
{
    public Guid Id { get; set; }
    public AccountType Type { get; set; }
}
