using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.Checkouts.UpdateCheckout;

public sealed class UpdateCheckoutRequest
{
    public Guid MerchantId { get; set; }
    public Guid CheckoutId { get; set; }

    // Checkout root fields
    public string? Name { get; set; }
    public string? Description { get; set; }
    public Guid? CheckoutTemplateId { get; set; }
    public bool? ClearCheckoutTemplate { get; set; }

    // Onboarding fields
    public int? OnboardingStep { get; set; }
    public bool? OnboardingCompleted { get; set; }

    // Payment settings
    public bool? PixEnabled { get; set; }
    public bool? CreditCardEnabled { get; set; }
    public bool? BoletoEnabled { get; set; }
    public int? PixExpirationMinutes { get; set; }
    public PaymentMethod? DefaultPaymentMethod { get; set; }
    public bool? ClearDefaultPaymentMethod { get; set; }

    // Feature settings
    public bool? CouponEnabled { get; set; }
    public bool? ShippingEnabled { get; set; }
    public long? FixedShippingAmount { get; set; }
    public bool? ClearFixedShippingAmount { get; set; }
    public bool? RequireCustomerPhone { get; set; }
    public bool? RequireCustomerAddress { get; set; }
    public bool? RequireCustomerDocument { get; set; }
    public int? ReservationExpirationMinutes { get; set; }

    // Redirect URLs
    public string? SuccessUrl { get; set; }
    public string? CancelUrl { get; set; }
    public string? CallbackUrl { get; set; }

    // Visual customization
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public CheckoutColorMode? ColorMode { get; set; }
    public string? LogoUrl { get; set; }
    public string? BackgroundImageUrl { get; set; }
    public string? FaviconUrl { get; set; }

    // Messages
    public string? HeaderMessage { get; set; }
    public string? SubHeaderMessage { get; set; }
    public string? FooterMessage { get; set; }
    public string? SuccessMessage { get; set; }
    public string? PageTitle { get; set; }

    // Timer settings
    public bool? ShowTimer { get; set; }
    public int? TimerMinutes { get; set; }
    public string? TimerText { get; set; }
    public string? TimerExpiredText { get; set; }

    // Social proof settings
    public bool? SocialProofEnabled { get; set; }
    public UpdateSocialProofSettingsRequest? SocialProofSettings { get; set; }

    // Tracking settings
    public UpdateTrackingSettingsRequest? TrackingSettings { get; set; }

    // SEO settings
    public UpdateSeoRequest? Seo { get; set; }

    // Contact settings
    public bool? ContactWhatsAppEnabled { get; set; }
    public string? ContactWhatsAppNumber { get; set; }
    public bool? ContactTelegramEnabled { get; set; }
    public string? ContactTelegramUsername { get; set; }
    public bool? ContactEmailEnabled { get; set; }
    public string? ContactEmail { get; set; }

    // Checkout products operations
    public List<UpdateCheckoutProductOperationRequest>? ProductOperations { get; set; }
}

public sealed class UpdateCheckoutProductOperationRequest
{
    public string Operation { get; set; } = string.Empty;
    public Guid? CheckoutProductId { get; set; }
    public Guid? ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public int? DisplayOrder { get; set; }
    public bool? IsActive { get; set; }
}

public sealed class UpdateTrackingSettingsRequest
{
    public UpdateClarityTrackingRequest? Clarity { get; set; }
    public UpdateFacebookPixelTrackingRequest? FacebookPixel { get; set; }
    public UpdateGoogleTagManagerTrackingRequest? GoogleTagManager { get; set; }
    public UpdateTikTokTrackingRequest? TikTok { get; set; }
    public UpdateKwaiTrackingRequest? Kwai { get; set; }
    public UpdatePinterestTrackingRequest? Pinterest { get; set; }
    public UpdateTaboolaTrackingRequest? Taboola { get; set; }
    public UpdateUtmifyTrackingRequest? Utmify { get; set; }
    public UpdateOtimizeyTrackingRequest? Otimizey { get; set; }
}

public sealed class UpdateClarityTrackingRequest
{
    public bool Enabled { get; set; }
    public string? ProjectId { get; set; }
}

public sealed class UpdateFacebookPixelTrackingRequest
{
    public bool Enabled { get; set; }
    public string? PixelId { get; set; }
    public string? AccessToken { get; set; }
    public string? TestEventCode { get; set; }
    public bool? EnableDeduplication { get; set; }
    public FacebookPixelEventSettings? Events { get; set; }
}

public sealed class UpdateGoogleTagManagerTrackingRequest
{
    public bool Enabled { get; set; }
    public string? ContainerId { get; set; }
    public GoogleTagManagerEventSettings? Events { get; set; }
}

public sealed class UpdateTikTokTrackingRequest
{
    public bool Enabled { get; set; }
    public string? PixelId { get; set; }
    public string? AccessToken { get; set; }
    public TikTokEventSettings? Events { get; set; }
}

public sealed class UpdateKwaiTrackingRequest
{
    public bool Enabled { get; set; }
    public string? PixelId { get; set; }
    public KwaiEventSettings? Events { get; set; }
}

public sealed class UpdatePinterestTrackingRequest
{
    public bool Enabled { get; set; }
    public string? TagId { get; set; }
    public PinterestEventSettings? Events { get; set; }
}

public sealed class UpdateTaboolaTrackingRequest
{
    public bool Enabled { get; set; }
    public string? AccountId { get; set; }
    public TaboolaEventSettings? Events { get; set; }
}

public sealed class UpdateUtmifyTrackingRequest
{
    public bool Enabled { get; set; }
    public string? PixelId { get; set; }
    public UtmifyEventSettings? Events { get; set; }
}

public sealed class UpdateOtimizeyTrackingRequest
{
    public bool Enabled { get; set; }
    public string? PixelId { get; set; }
    public OtimizeyEventSettings? Events { get; set; }
}

public sealed class UpdateSocialProofSettingsRequest
{
    public bool Enabled { get; set; }
    public int? IntervalSeconds { get; set; }
    public int? DurationSeconds { get; set; }
    public string? Position { get; set; }
    public List<UpdateSocialProofNotificationRequest>? Notifications { get; set; }
}

public sealed class UpdateSocialProofNotificationRequest
{
    public required string Name { get; set; }
    public required string Location { get; set; }
    public required string Action { get; set; }
}

public sealed class UpdateSeoRequest
{
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? MetaKeywords { get; set; }
    public string? CanonicalUrl { get; set; }
    public string? Robots { get; set; }
    public UpdateOpenGraphRequest? OpenGraph { get; set; }
    public UpdateTwitterCardRequest? Twitter { get; set; }
}

public sealed class UpdateOpenGraphRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string? ImageAlt { get; set; }
    public int? ImageWidth { get; set; }
    public int? ImageHeight { get; set; }
    public string? SiteName { get; set; }
    public string? Locale { get; set; }
    public string? Type { get; set; }
}

public sealed class UpdateTwitterCardRequest
{
    public string? Card { get; set; }
    public string? Site { get; set; }
    public string? Creator { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
}

public sealed class UpdateCheckoutRequestValidator : Validator<UpdateCheckoutRequest>
{
    public UpdateCheckoutRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.CheckoutId)
            .NotEmpty()
            .WithMessage("O identificador do checkout é obrigatório.");

        RuleFor(x => x.Name)
            .MaximumLength(100)
            .When(x => x.Name != null)
            .WithMessage("O nome deve ter no máximo 100 caracteres.");

        RuleFor(x => x.Description)
            .MaximumLength(500)
            .When(x => x.Description != null)
            .WithMessage("A descrição deve ter no máximo 500 caracteres.");

        RuleFor(x => x.ClearCheckoutTemplate)
            .Must(x => x != true)
            .WithMessage("Após selecionar um template, não é possível removê-lo. Selecione outro template para trocar.");

        RuleFor(x => x.OnboardingStep)
            .GreaterThanOrEqualTo(0)
            .When(x => x.OnboardingStep.HasValue)
            .WithMessage("A etapa deve ser maior ou igual a 0.");

        RuleFor(x => x.PixExpirationMinutes)
            .InclusiveBetween(5, 60)
            .When(x => x.PixExpirationMinutes.HasValue)
            .WithMessage("O tempo de expiração do PIX deve ser entre 5 e 60 minutos.");

        RuleFor(x => x.FixedShippingAmount)
            .GreaterThan(0)
            .When(x => x.FixedShippingAmount.HasValue)
            .WithMessage("O valor do frete fixo deve ser maior que zero.");

        RuleFor(x => x.SuccessUrl)
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
            .When(x => !string.IsNullOrEmpty(x.SuccessUrl))
            .WithMessage("A URL de sucesso deve ser válida.");

        RuleFor(x => x.CancelUrl)
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
            .When(x => !string.IsNullOrEmpty(x.CancelUrl))
            .WithMessage("A URL de cancelamento deve ser válida.");

        RuleFor(x => x.CallbackUrl)
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
            .When(x => !string.IsNullOrEmpty(x.CallbackUrl))
            .WithMessage("A URL de callback deve ser válida.");

        RuleFor(x => x.PrimaryColor)
            .Matches("^#[0-9A-Fa-f]{6}$")
            .When(x => !string.IsNullOrEmpty(x.PrimaryColor))
            .WithMessage("A cor primária deve estar no formato hexadecimal (ex: #FF5500).");

        RuleFor(x => x.SecondaryColor)
            .Matches("^#[0-9A-Fa-f]{6}$")
            .When(x => !string.IsNullOrEmpty(x.SecondaryColor))
            .WithMessage("A cor secundária deve estar no formato hexadecimal.");

        RuleFor(x => x.HeaderMessage)
            .MaximumLength(500)
            .When(x => x.HeaderMessage != null)
            .WithMessage("A mensagem de cabeçalho deve ter no máximo 500 caracteres.");

        RuleFor(x => x.FooterMessage)
            .MaximumLength(500)
            .When(x => x.FooterMessage != null)
            .WithMessage("A mensagem de rodapé deve ter no máximo 500 caracteres.");

        RuleFor(x => x.SuccessMessage)
            .MaximumLength(500)
            .When(x => x.SuccessMessage != null)
            .WithMessage("A mensagem de sucesso deve ter no máximo 500 caracteres.");

        RuleFor(x => x.PageTitle)
            .MaximumLength(100)
            .When(x => x.PageTitle != null)
            .WithMessage("O título da página deve ter no máximo 100 caracteres.");

        RuleFor(x => x.TimerMinutes)
            .InclusiveBetween(1, 60)
            .When(x => x.TimerMinutes.HasValue)
            .WithMessage("O tempo do timer deve ser entre 1 e 60 minutos.");

        RuleFor(x => x.TimerText)
            .MaximumLength(200)
            .When(x => x.TimerText != null)
            .WithMessage("O texto do timer deve ter no máximo 200 caracteres.");

        RuleFor(x => x.TimerExpiredText)
            .MaximumLength(200)
            .When(x => x.TimerExpiredText != null)
            .WithMessage("O texto de expiração do timer deve ter no máximo 200 caracteres.");

        RuleFor(x => x.ReservationExpirationMinutes)
            .InclusiveBetween(1, 60)
            .When(x => x.ReservationExpirationMinutes.HasValue)
            .WithMessage("O tempo de expiração da reserva deve ser entre 1 e 60 minutos.");

        RuleForEach(x => x.ProductOperations)
            .SetValidator(new UpdateCheckoutProductOperationRequestValidator())
            .When(x => x.ProductOperations is { Count: > 0 });
    }
}

public sealed class UpdateCheckoutProductOperationRequestValidator : Validator<UpdateCheckoutProductOperationRequest>
{
    public UpdateCheckoutProductOperationRequestValidator()
    {
        RuleFor(x => x.Operation)
            .NotEmpty()
            .WithMessage("A operação do produto é obrigatória.")
            .Must(operation =>
                operation.Equals("add", StringComparison.OrdinalIgnoreCase)
                || operation.Equals("update", StringComparison.OrdinalIgnoreCase)
                || operation.Equals("remove", StringComparison.OrdinalIgnoreCase))
            .WithMessage("A operação do produto deve ser add, update ou remove.");

        RuleFor(x => x.ProductId)
            .NotEmpty()
            .When(x => x.Operation.Equals("add", StringComparison.OrdinalIgnoreCase))
            .WithMessage("O identificador do produto é obrigatório para operação add.");

        RuleFor(x => x.CheckoutProductId)
            .NotEmpty()
            .When(x => x.Operation.Equals("update", StringComparison.OrdinalIgnoreCase)
                || x.Operation.Equals("remove", StringComparison.OrdinalIgnoreCase))
            .WithMessage("O identificador do produto do checkout é obrigatório para operação update/remove.");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0)
            .When(x => x.DisplayOrder.HasValue)
            .WithMessage("A ordem de exibição deve ser maior ou igual a 0.");
    }
}

public sealed class UpdateCheckoutResponse : BaseResponse<CheckoutData>;
