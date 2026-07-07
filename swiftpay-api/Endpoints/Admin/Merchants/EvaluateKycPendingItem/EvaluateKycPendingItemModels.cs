using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Merchants.EvaluateKycPendingItem;

public sealed class EvaluateKycPendingItemRequest
{
    public Guid MerchantId { get; set; }
    public Guid ItemId { get; set; }
    public KycPendingItemEvaluationStatus Status { get; set; }
    public string? Notes { get; set; }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum KycPendingItemEvaluationStatus
{
    Approved,
    Rejected
}

public sealed class EvaluateKycPendingItemValidator : Validator<EvaluateKycPendingItemRequest>
{
    public EvaluateKycPendingItemValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.ItemId)
            .NotEmpty()
            .WithMessage("O identificador do item é obrigatório.");

        RuleFor(x => x.Status)
            .IsInEnum()
            .WithMessage("Status de avaliação inválido.");

        RuleFor(x => x.Notes)
            .NotEmpty()
            .When(x => x.Status == KycPendingItemEvaluationStatus.Rejected)
            .WithMessage("O motivo da rejeição é obrigatório.");
    }
}

public sealed class EvaluateKycPendingItemResponse : BaseResponse<EvaluateKycPendingItemData>;

public sealed class EvaluateKycPendingItemData
{
    public Guid Id { get; set; }
    public string Status { get; set; } = null!;
    public string? AdminNotes { get; set; }
    public DateTime? EvaluatedAt { get; set; }
}
