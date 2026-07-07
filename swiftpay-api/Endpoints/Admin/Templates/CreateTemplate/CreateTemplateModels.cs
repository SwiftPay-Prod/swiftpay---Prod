using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.Templates.CreateTemplate;

public sealed class CreateTemplateRequest
{
    public string Code { get; set; } = null!;
    public CheckoutTemplateType Type { get; set; }
    public string Name { get; set; } = null!;
    public string? ShortDescription { get; set; }
    public string? FullDescription { get; set; }
    public string? BestFor { get; set; }
    public string? ThumbnailUrl { get; set; }
    public List<string>? PreviewImages { get; set; }
    public List<string>? Features { get; set; }
    
    /// <summary>
    /// Modo de cobrança da taxa do template por transação.
    /// Null indica template gratuito (sem taxa adicional).
    /// </summary>
    public FeeChargeMode? FeeMode { get; set; }
    
    /// <summary>
    /// Taxa fixa do template em centavos
    /// </summary>
    public long FeeFixed { get; set; } = 0;
    
    /// <summary>
    /// Taxa percentual do template em basis points (150 = 1.5%)
    /// </summary>
    public int FeePercentage { get; set; } = 0;
    
    public bool IsActive { get; set; } = true;

    public bool SupportsCoupons { get; set; } = true;
    public bool SupportsShipping { get; set; } = false;
    public bool SupportsTimer { get; set; } = false;
    public bool SupportsSocialProof { get; set; } = false;
    
    // Tracking support
    public bool SupportsClarity { get; set; } = true;
    public bool SupportsFacebookPixel { get; set; } = true;
    public bool SupportsGoogleTagManager { get; set; } = true;
    public bool SupportsTikTok { get; set; } = true;
    public bool SupportsKwai { get; set; } = true;
    public bool SupportsPinterest { get; set; } = true;
    public bool SupportsTaboola { get; set; } = true;
    public bool SupportsUtmify { get; set; } = true;
    public bool SupportsOtimizey { get; set; } = true;
}

public sealed class CreateTemplateRequestValidator : Validator<CreateTemplateRequest>
{
    public CreateTemplateRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty()
            .WithMessage("O código do template é obrigatório.")
            .MaximumLength(50)
            .WithMessage("O código do template deve ter no máximo 50 caracteres.")
            .Matches(@"^[a-z0-9-]+$")
            .WithMessage("O código deve conter apenas letras minúsculas, números e hífens.");

        RuleFor(x => x.Type)
            .IsInEnum()
            .WithMessage("Tipo de template inválido.");

        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("O nome do template é obrigatório.")
            .MaximumLength(100)
            .WithMessage("O nome do template deve ter no máximo 100 caracteres.");

        RuleFor(x => x.ShortDescription)
            .MaximumLength(200)
            .WithMessage("A descrição curta deve ter no máximo 200 caracteres.");

        RuleFor(x => x.FullDescription)
            .MaximumLength(2000)
            .WithMessage("A descrição completa deve ter no máximo 2000 caracteres.");

        RuleFor(x => x.BestFor)
            .MaximumLength(500)
            .WithMessage("O campo 'indicado para' deve ter no máximo 500 caracteres.");

        RuleFor(x => x.FeeMode)
            .IsInEnum()
            .When(x => x.FeeMode.HasValue)
            .WithMessage("Modo de cobrança inválido.");

        RuleFor(x => x.FeeFixed)
            .GreaterThanOrEqualTo(0)
            .WithMessage("A taxa fixa deve ser maior ou igual a zero.");

        RuleFor(x => x.FeePercentage)
            .InclusiveBetween(0, 10000)
            .WithMessage("A taxa percentual deve estar entre 0 e 10000 basis points (0% a 100%).");

        RuleFor(x => x.FeeFixed)
            .GreaterThan(0)
            .When(x => x.FeeMode == FeeChargeMode.FixedOnly || x.FeeMode == FeeChargeMode.FixedAndPercentage)
            .WithMessage("A taxa fixa é obrigatória para este modo de cobrança.");

        RuleFor(x => x.FeePercentage)
            .GreaterThan(0)
            .When(x => x.FeeMode == FeeChargeMode.PercentageOnly || x.FeeMode == FeeChargeMode.FixedAndPercentage)
            .WithMessage("A taxa percentual é obrigatória para este modo de cobrança.");
    }
}

public sealed class CreateTemplateResponse : BaseResponse<AdminTemplateData>;
