using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Admin.Balance.CreatePlatformBalanceAdjustment;

/// <summary>
/// Escopo do ajuste manual de saldo
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AdjustmentScope
{
    /// <summary>
    /// Ajuste na conta da adquirente (AcquirerSettlement) - para conciliação bancária
    /// </summary>
    Acquirer,

    /// <summary>
    /// Ajuste na conta do merchant (MerchantAvailable)
    /// </summary>
    Merchant,

    /// <summary>
    /// Legado: ajustes globais da plataforma não são mais suportados.
    /// </summary>
    Platform
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AcquirerAdjustmentTarget
{
    Settlement,
    MerchantBalance,
    SafefyProfit
}

public sealed class CreatePlatformBalanceAdjustmentRequest
{
    /// <summary>
    /// Escopo do ajuste (Acquirer ou Merchant)
    /// </summary>
    public AdjustmentScope Scope { get; set; }

    /// <summary>
    /// ID da adquirente (obrigatório para Scope = Acquirer)
    /// </summary>
    public Guid? AcquirerId { get; set; }

    /// <summary>
    /// Alvo do ajuste da adquirente (obrigatório para Scope = Acquirer).
    /// </summary>
    public AcquirerAdjustmentTarget? AcquirerTarget { get; set; }

    /// <summary>
    /// ID do merchant (obrigatório para Scope = Merchant)
    /// </summary>
    public Guid? MerchantId { get; set; }

    /// <summary>
    /// Ambiente (obrigatório para Scope = Merchant)
    /// </summary>
    public ApiEnvironment? Environment { get; set; }

    /// <summary>
    /// Valor do ajuste em centavos
    /// </summary>
    public long Amount { get; set; }

    /// <summary>
    /// true = crédito (adiciona saldo), false = débito (remove saldo)
    /// </summary>
    public bool IsCredit { get; set; }

    /// <summary>
    /// Motivo do ajuste
    /// </summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// ID do vínculo de adquirente do merchant (opcional para Scope = Merchant; direciona ao bucket correto)
    /// </summary>
    public Guid? MerchantAcquirerId { get; set; }
}

public sealed class CreatePlatformBalanceAdjustmentRequestValidator : Validator<CreatePlatformBalanceAdjustmentRequest>
{
    public CreatePlatformBalanceAdjustmentRequestValidator()
    {
        RuleFor(x => x.Scope)
            .IsInEnum()
            .WithMessage("Escopo de ajuste inválido.");

        RuleFor(x => x.AcquirerId)
            .NotEmpty()
            .When(x => x.Scope == AdjustmentScope.Acquirer)
            .WithMessage("A adquirente é obrigatória para ajustes de adquirente.");

        RuleFor(x => x.AcquirerTarget)
            .NotNull()
            .When(x => x.Scope == AdjustmentScope.Acquirer)
            .WithMessage("O alvo do ajuste da adquirente é obrigatório.");

        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .When(x => x.Scope == AdjustmentScope.Merchant)
            .WithMessage("A organização é obrigatória para ajustes de organização.");

        RuleFor(x => x.Environment)
            .NotNull()
            .When(x => x.Scope == AdjustmentScope.Merchant)
            .WithMessage("O ambiente é obrigatório para ajustes de organização.");

        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage("O valor do ajuste deve ser maior que zero.");

        RuleFor(x => x.Reason)
            .NotEmpty()
            .WithMessage("O motivo do ajuste é obrigatório.")
            .MaximumLength(500)
            .WithMessage("O motivo do ajuste deve ter no máximo 500 caracteres.");
    }
}

public sealed class CreatePlatformBalanceAdjustmentResponse : BaseResponse<AdminPlatformBalanceAdjustmentData>;

public sealed class AdminPlatformBalanceAdjustmentData
{
    public string TransactionId { get; set; } = null!;
    public AdjustmentScope Scope { get; set; }
    public Guid? AcquirerId { get; set; }
    public AcquirerAdjustmentTarget? AcquirerTarget { get; set; }
    public Guid? MerchantId { get; set; }
    public ApiEnvironment? Environment { get; set; }
    public long Amount { get; set; }
    public bool IsCredit { get; set; }
    public string Reason { get; set; } = null!;
    public long NewTargetBalance { get; set; }
    public long? NewPlatformBalance { get; set; }
    public Guid? MerchantAcquirerId { get; set; }
    public DateTime CreatedAt { get; set; }
}
