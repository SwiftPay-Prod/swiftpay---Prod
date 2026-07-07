using FastEndpoints;
using FluentValidation;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_payment.Endpoints.Models;

namespace swiftpay_api_payment.Endpoints.Cashouts.Create;

public sealed class CreateCashoutRequest
{
    public long Amount { get; set; }

    public Guid? PayoutAccountId { get; set; }

    public string? PixKeyType { get; set; }

    public string? PixKey { get; set; }

    public string? ExternalId { get; set; }

    public string? CallbackUrl { get; set; }
}

public sealed class CreateCashoutRequestValidator : Validator<CreateCashoutRequest>
{
    private static readonly string[] ValidPixKeyTypes = ["CPF", "CNPJ", "Email", "Phone", "Random"];

    public CreateCashoutRequestValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("O valor deve ser maior que zero.")
            .LessThanOrEqualTo(100000000).WithMessage("O valor não pode exceder R$ 1.000.000,00.");

        RuleFor(x => x)
            .Must(x => x.PayoutAccountId.HasValue || (!string.IsNullOrEmpty(x.PixKey) && !string.IsNullOrEmpty(x.PixKeyType)))
            .WithMessage("Informe o ID da conta de saque (payoutAccountId) ou a chave PIX inline (pixKey + pixKeyType).")
            .Must(x => !(x.PayoutAccountId.HasValue && !string.IsNullOrEmpty(x.PixKey)))
            .WithMessage("Informe apenas payoutAccountId ou pixKey, não ambos.");

        RuleFor(x => x.PixKeyType)
            .Must(v => ValidPixKeyTypes.Contains(v))
            .When(x => !string.IsNullOrEmpty(x.PixKeyType))
            .WithMessage($"O tipo de chave PIX deve ser um dos seguintes: {string.Join(", ", ValidPixKeyTypes)}.");

        RuleFor(x => x.PixKey)
            .MaximumLength(200).WithMessage("A chave PIX deve ter no máximo 200 caracteres.");

        RuleFor(x => x.ExternalId)
            .MaximumLength(100).WithMessage("O ID externo deve ter no máximo 100 caracteres.");

        RuleFor(x => x.CallbackUrl)
            .Must(BeValidUrl).When(x => !string.IsNullOrEmpty(x.CallbackUrl))
            .WithMessage("A URL de callback deve ser válida.");
    }

    private static bool BeValidUrl(string? url)
    {
        if (string.IsNullOrEmpty(url)) return true;
        return Uri.TryCreate(url, UriKind.Absolute, out var uriResult)
            && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
    }
}

public sealed class CreateCashoutResponse : BaseResponse<CashoutData>;

public sealed class CashoutData
{
    public Guid Id { get; set; }

    public string? ExternalId { get; set; }

    public long Amount { get; set; }

    public long Fee { get; set; }

    public long NetAmount { get; set; }

    public string Currency { get; set; } = "BRL";

    public PayoutStatus Status { get; set; }

    public ApiEnvironment Environment { get; set; }

    public CashoutPixData Pix { get; set; } = new();

    public DateTime RequestedAt { get; set; }

    public DateTime? ProcessedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public string? FailureReason { get; set; }

    public DateTime CreatedAt { get; set; }
}

public sealed class CashoutPixData
{
    public string? PixKeyType { get; set; }

    public string? PixKey { get; set; }

    public string? EndToEndId { get; set; }
}
