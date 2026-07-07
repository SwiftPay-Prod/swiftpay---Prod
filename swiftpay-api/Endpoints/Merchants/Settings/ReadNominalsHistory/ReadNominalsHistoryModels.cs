using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Merchants.Settings.ReadNominalsHistory;

public sealed class ReadNominalsHistoryRequest
{
    public Guid MerchantId { get; set; }
}

public sealed class ReadNominalsHistoryRequestValidator : Validator<ReadNominalsHistoryRequest>
{
    public ReadNominalsHistoryRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organizacao e obrigatorio.");
    }
}

public sealed class ReadNominalsHistoryResponse : BaseResponse<ReadNominalsHistoryData>;

public sealed class ReadNominalsHistoryData
{
    public List<MerchantNominalHistoryItem> Items { get; set; } = [];
}

public sealed class MerchantNominalHistoryItem
{
    public Guid AcquirerId { get; set; }
    public string DisplayLabel { get; set; } = string.Empty;
    public string Nominal { get; set; } = string.Empty;
    public long TotalTransactions { get; set; }
    public int TimesSelected { get; set; }
    public DateTime? FirstTransactionAt { get; set; }
    public DateTime? LastTransactionAt { get; set; }
    public DateTime? LastSelectedAt { get; set; }
    public bool IsCurrent { get; set; }
}