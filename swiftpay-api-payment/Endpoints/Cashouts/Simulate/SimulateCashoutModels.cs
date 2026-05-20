using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_payment.Endpoints.Models;
using safefy_api_payment.Services.Sandbox;
using FastEndpoints;
using FluentValidation;

namespace safefy_api_payment.Endpoints.Cashouts.Simulate;

public sealed class SimulateCashoutRequest
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
}

public sealed class SimulateCashoutRequestValidator : Validator<SimulateCashoutRequest>
{
    public SimulateCashoutRequestValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("O ID do saque é obrigatório.");

        RuleFor(x => x.Action)
            .NotEmpty().WithMessage("A ação é obrigatória.")
            .Must(a => Enum.TryParse<SimulateCashoutAction>(a, true, out _))
            .WithMessage("Ação de simulação inválida. Valores aceitos: complete, fail, reject.");
    }
}

public sealed class SimulateCashoutResponse : BaseResponse<SimulateCashoutData>;

public sealed class SimulateCashoutData
{
    public Guid Id { get; set; }

    public string? ExternalId { get; set; }

    public long Amount { get; set; }

    public long Fee { get; set; }

    public long NetAmount { get; set; }

    public string Currency { get; set; } = "BRL";

    public PayoutStatus Status { get; set; }

    public ApiEnvironment Environment { get; set; }

    public SimulateCashoutPixData Pix { get; set; } = new();

    public DateTime RequestedAt { get; set; }

    public DateTime? ProcessedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public string? FailureReason { get; set; }

    public DateTime CreatedAt { get; set; }
}

public sealed class SimulateCashoutPixData
{
    public string? PixKeyType { get; set; }

    public string? PixKey { get; set; }

    public string? EndToEndId { get; set; }

    public string? AcquirerTransactionId { get; set; }
}
