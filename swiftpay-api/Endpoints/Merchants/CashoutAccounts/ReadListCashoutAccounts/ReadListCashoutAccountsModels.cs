using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Merchants.CashoutAccounts.ReadListCashoutAccounts;

public sealed class ListCashoutAccountsRequest
{
    public Guid MerchantId { get; set; }
    public List<PayoutAccountStatus>? Statuses { get; set; }
}

public sealed class ReadListCashoutAccountsRequestValidator : Validator<ListCashoutAccountsRequest>
{
    public ReadListCashoutAccountsRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");
    }
}

public sealed class ListCashoutAccountsResponse : BaseResponse<ListCashoutAccountsData>;

public sealed class ListCashoutAccountsData
{
    public List<CashoutAccountItem> Items { get; set; } = [];
    public int TotalItems { get; set; }
}

public sealed class CashoutAccountItem
{
    public Guid Id { get; set; }
    public PixKeyType PixKeyType { get; set; }
    public string PixKey { get; set; } = string.Empty;
    public string? HolderName { get; set; }
    public string? BankName { get; set; }
    public PayoutAccountStatus Status { get; set; }
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; }
}
