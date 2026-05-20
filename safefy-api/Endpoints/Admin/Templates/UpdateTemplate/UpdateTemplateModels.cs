using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Templates.UpdateTemplate;

public sealed class UpdateTemplateRequest
{
    public Guid TemplateId { get; set; }
    public string? Code { get; set; }
    public CheckoutTemplateType? Type { get; set; }
    public string? Name { get; set; }
    public string? ShortDescription { get; set; }
    public string? FullDescription { get; set; }
    public string? BestFor { get; set; }
    public string? ThumbnailUrl { get; set; }
    public List<string>? PreviewImages { get; set; }
    public List<string>? Features { get; set; }
    
    /// <summary>
    /// Modo de cobrança da taxa do template. Null para remover taxa (gratuito).
    /// </summary>
    public FeeChargeMode? FeeMode { get; set; }
    
    /// <summary>
    /// Taxa fixa do template em centavos
    /// </summary>
    public long? FeeFixed { get; set; }
    
    /// <summary>
    /// Taxa percentual do template em basis points (150 = 1.5%)
    /// </summary>
    public int? FeePercentage { get; set; }
    
    /// <summary>
    /// Flag para remover a taxa do template (torná-lo gratuito)
    /// </summary>
    public bool? RemoveFee { get; set; }
    
    public bool? IsActive { get; set; }

    public bool? SupportsCoupons { get; set; }
    public bool? SupportsShipping { get; set; }
    public bool? SupportsTimer { get; set; }
    public bool? SupportsSocialProof { get; set; }
    
    // Tracking support
    public bool? SupportsClarity { get; set; }
    public bool? SupportsFacebookPixel { get; set; }
    public bool? SupportsGoogleTagManager { get; set; }
    public bool? SupportsTikTok { get; set; }
    public bool? SupportsKwai { get; set; }
    public bool? SupportsPinterest { get; set; }
    public bool? SupportsTaboola { get; set; }
    public bool? SupportsUtmify { get; set; }
    public bool? SupportsOtimizey { get; set; }
}

public sealed class UpdateTemplateRequestValidator : Validator<UpdateTemplateRequest>
{
    public UpdateTemplateRequestValidator()
    {
        RuleFor(x => x.TemplateId)
            .NotEmpty()
            .WithMessage("O identificador do template é obrigatório.");

        RuleFor(x => x.Code)
            .MaximumLength(50)
            .When(x => x.Code != null)
            .WithMessage("O código do template deve ter no máximo 50 caracteres.")
            .Matches(@"^[a-z0-9-]+$")
            .When(x => !string.IsNullOrEmpty(x.Code))
            .WithMessage("O código deve conter apenas letras minúsculas, números e hífens.");

        RuleFor(x => x.Type)
            .IsInEnum()
            .When(x => x.Type.HasValue)
            .WithMessage("Tipo de template inválido.");

        RuleFor(x => x.Name)
            .MaximumLength(100)
            .When(x => x.Name != null)
            .WithMessage("O nome do template deve ter no máximo 100 caracteres.");

        RuleFor(x => x.ShortDescription)
            .MaximumLength(200)
            .When(x => x.ShortDescription != null)
            .WithMessage("A descrição curta deve ter no máximo 200 caracteres.");

        RuleFor(x => x.FullDescription)
            .MaximumLength(2000)
            .When(x => x.FullDescription != null)
            .WithMessage("A descrição completa deve ter no máximo 2000 caracteres.");

        RuleFor(x => x.BestFor)
            .MaximumLength(500)
            .When(x => x.BestFor != null)
            .WithMessage("O campo 'indicado para' deve ter no máximo 500 caracteres.");

        RuleFor(x => x.FeeMode)
            .IsInEnum()
            .When(x => x.FeeMode.HasValue)
            .WithMessage("Modo de cobrança inválido.");

        RuleFor(x => x.FeeFixed)
            .GreaterThanOrEqualTo(0)
            .When(x => x.FeeFixed.HasValue)
            .WithMessage("A taxa fixa deve ser maior ou igual a zero.");

        RuleFor(x => x.FeePercentage)
            .InclusiveBetween(0, 10000)
            .When(x => x.FeePercentage.HasValue)
            .WithMessage("A taxa percentual deve estar entre 0 e 10000 basis points (0% a 100%).");
    }
}

public sealed class UpdateTemplateResponse : BaseResponse<AdminTemplateData>;
