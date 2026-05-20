using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Admin.Acquirers.ReadAcquirerPixNominalHistory;

public sealed class ReadAcquirerPixNominalHistoryRequest
{
    public Guid AcquirerId { get; set; }
}

public sealed class ReadAcquirerPixNominalHistoryRequestValidator : Validator<ReadAcquirerPixNominalHistoryRequest>
{
    public ReadAcquirerPixNominalHistoryRequestValidator()
    {
        RuleFor(x => x.AcquirerId)
            .NotEmpty()
            .WithMessage("O identificador da adquirente é obrigatório.");
    }
}

public sealed class ReadAcquirerPixNominalHistoryResponse : BaseResponse<List<AdminAcquirerPixNominalHistoryItem>>;

public sealed class AdminAcquirerPixNominalHistoryItem
{
    public Guid Id { get; set; }
    public string? MerchantName { get; set; }
    public string? PreviousNominal { get; set; }
    public string NewNominal { get; set; } = null!;
    public string Source { get; set; } = null!;
    public Guid? ChangedByUserId { get; set; }
    public string? ChangedByUserName { get; set; }
    public Guid? DetectedFromPaymentId { get; set; }
    public DateTime CreatedAt { get; set; }
}
