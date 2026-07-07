using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Merchants.Shared.Models;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.Merchants.EvaluateMerchantKyc;

public sealed class EvaluateMerchantKycRequest
{
    public Guid MerchantId { get; set; }
    public MerchantKycEvaluationStatus Status { get; set; }
    public string? Reason { get; set; }
    public List<EvaluatePendingItemRequest>? PendingItems { get; set; }
}

public sealed class EvaluatePendingItemRequest
{
    public MerchantKycPendingItemType Type { get; set; }
    public MerchantKycPendingField FieldKey { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MerchantKycEvaluationStatus
{
    Approved,
    Rejected,
    Complement
}

public sealed class EvaluateMerchantKycValidator : Validator<EvaluateMerchantKycRequest>
{
    public EvaluateMerchantKycValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.Status)
            .IsInEnum()
            .WithMessage("O status de avaliação é inválido.");

        // Reason is required for Rejected and Complement
        RuleFor(x => x.Reason)
            .NotEmpty()
            .When(x => x.Status == MerchantKycEvaluationStatus.Rejected)
            .WithMessage("O motivo é obrigatório para rejeição de complemento.");

        // PendingItems is required when status is Complement
        RuleFor(x => x.PendingItems)
            .NotEmpty()
            .When(x => x.Status == MerchantKycEvaluationStatus.Complement)
            .WithMessage("É necessário informar pelo menos um item pendente para solicitação de complemento.");

        RuleForEach(x => x.PendingItems)
            .ChildRules(item =>
            {
                item.RuleFor(x => x.Title)
                    .NotEmpty()
                    .WithMessage("O título do item é obrigatório.")
                    .MaximumLength(200)
                    .WithMessage("O título deve ter no máximo 200 caracteres.");

                item.RuleFor(x => x.FieldKey)
                    .IsInEnum()
                    .WithMessage("O campo alvo é obrigatório.");

                item.RuleFor(x => x.Description)
                    .MaximumLength(2000)
                    .WithMessage("A descrição deve ter no máximo 2000 caracteres.")
                    .When(x => !string.IsNullOrWhiteSpace(x.Description));
            })
            .When(x => x.PendingItems != null && x.PendingItems.Count > 0);
    }
}

public sealed class EvaluateMerchantKycResponse : BaseResponse<MerchantData>;
