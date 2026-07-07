using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Checkouts;

public sealed class CheckoutData
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string Slug { get; set; } = null!;
    public string ShortId { get; set; } = null!;
    public CheckoutStatus Status { get; set; }
    public ApiEnvironment Environment { get; set; }
    public bool OnboardingCompleted { get; set; }
    public int OnboardingStep { get; set; }
    public CheckoutTemplateData? Template { get; set; }
    public CheckoutConfigData? Config { get; set; }
    public ICollection<CheckoutProductData> Products { get; set; } = [];
    public ICollection<CheckoutCouponData> Coupons { get; set; } = [];
    public CheckoutKpisData Kpis { get; set; } = new();
    public string? CheckoutUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class CheckoutKpisData
{
    public int AccessCount { get; set; }
    public long RevenueAmount { get; set; }
    public int OrderCount { get; set; }
    public int TransactionCount { get; set; }
    public int CompletedTransactions { get; set; }
    public decimal ApprovalRate { get; set; }
    public int CustomerCount { get; set; }
}

public sealed class MinimalCheckout
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string Slug { get; set; } = null!;
    public string ShortId { get; set; } = null!;
    public CheckoutStatus Status { get; set; }
    public ApiEnvironment Environment { get; set; }
    public bool OnboardingCompleted { get; set; }
    public int OnboardingStep { get; set; }
    public CheckoutTemplateMinimal? Template { get; set; }
    public int ProductCount { get; set; }
    public int CouponCount { get; set; }
    public int PaymentCount { get; set; }
    public string? CheckoutUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class CheckoutTemplateData
{
    public Guid Id { get; set; }
    public string Code { get; set; } = null!;
    public CheckoutTemplateType Type { get; set; }
    public string Name { get; set; } = null!;
    public string? ShortDescription { get; set; }
    public string? FullDescription { get; set; }
    public string? BestFor { get; set; }
    public string? ThumbnailUrl { get; set; }
    public List<string> PreviewImages { get; set; } = [];
    public List<string> Features { get; set; } = [];
    
    /// <summary>
    /// Modo de cobrança da taxa do template por transação.
    /// Null indica template gratuito (sem taxa adicional).
    /// </summary>
    public FeeChargeMode? FeeMode { get; set; }
    
    /// <summary>
    /// Taxa fixa do template em centavos
    /// </summary>
    public long FeeFixed { get; set; }
    
    /// <summary>
    /// Taxa percentual do template em basis points (150 = 1.5%)
    /// </summary>
    public int FeePercentage { get; set; }
    
    public bool IsActive { get; set; }
    public bool SupportsCoupons { get; set; }
    public bool SupportsShipping { get; set; }
    public bool SupportsTimer { get; set; }
    public bool SupportsSocialProof { get; set; }
    
    // Tracking Supports
    public bool SupportsClarity { get; set; }
    public bool SupportsFacebookPixel { get; set; }
    public bool SupportsGoogleTagManager { get; set; }
    public bool SupportsTikTok { get; set; }
    public bool SupportsKwai { get; set; }
    public bool SupportsPinterest { get; set; }
    public bool SupportsTaboola { get; set; }
    public bool SupportsUtmify { get; set; }
    public bool SupportsOtimizey { get; set; }
}

public sealed class CheckoutTemplateMinimal
{
    public Guid Id { get; set; }
    public CheckoutTemplateType Type { get; set; }
    public string Name { get; set; } = null!;
    public string? ThumbnailUrl { get; set; }
}

public sealed class CheckoutConfigData
{
    public Guid Id { get; set; }
    
    // Payment Settings
    public bool PixEnabled { get; set; }
    public bool CreditCardEnabled { get; set; }
    public bool BoletoEnabled { get; set; }
    public int PixExpirationMinutes { get; set; }
    public PaymentMethod? DefaultPaymentMethod { get; set; }
    
    // Feature Settings
    public bool CouponEnabled { get; set; }
    public bool ShippingEnabled { get; set; }
    public long? FixedShippingAmount { get; set; }
    public bool RequireCustomerPhone { get; set; }
    public bool RequireCustomerAddress { get; set; }
    public bool RequireCustomerDocument { get; set; }
    public int ReservationExpirationMinutes { get; set; }
    
    // Redirect URLs
    public string? SuccessUrl { get; set; }
    public string? CancelUrl { get; set; }
    public string? CallbackUrl { get; set; }
    
    // Visual Customization
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public CheckoutColorMode ColorMode { get; set; }
    public string? LogoUrl { get; set; }
    public string? BackgroundImageUrl { get; set; }
    public string? FaviconUrl { get; set; }
    
    // Custom Messages
    public string? HeaderMessage { get; set; }
    public string? SubHeaderMessage { get; set; }
    public string? FooterMessage { get; set; }
    public string? SuccessMessage { get; set; }
    public string? PageTitle { get; set; }
    
    // Timer Settings
    public bool ShowTimer { get; set; }
    public int? TimerMinutes { get; set; }
    public string? TimerText { get; set; }
    public string? TimerExpiredText { get; set; }
    
    // Social Proof Settings
    public bool SocialProofEnabled { get; set; }
    public SocialProofSettings? SocialProofSettings { get; set; }
    
    // Tracking Settings
    public TrackingSettings? TrackingSettings { get; set; }
    
    // Contact Settings
    public bool ContactWhatsAppEnabled { get; set; }
    public string? ContactWhatsAppNumber { get; set; }
    public bool ContactTelegramEnabled { get; set; }
    public string? ContactTelegramUsername { get; set; }
    public bool ContactEmailEnabled { get; set; }
    public string? ContactEmail { get; set; }
    
    // SEO Settings
    public SeoConfigData? Seo { get; set; }
}

public sealed class SeoConfigData
{
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? MetaKeywords { get; set; }
    public string? CanonicalUrl { get; set; }
    public string? Robots { get; set; }
    public OpenGraphConfigData? OpenGraph { get; set; }
    public TwitterCardConfigData? Twitter { get; set; }
}

public sealed class OpenGraphConfigData
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int? ImageWidth { get; set; }
    public int? ImageHeight { get; set; }
    public string? ImageAlt { get; set; }
    public string? SiteName { get; set; }
    public string? Locale { get; set; }
    public string? Type { get; set; }
}

public sealed class TwitterCardConfigData
{
    public string? Card { get; set; }
    public string? Site { get; set; }
    public string? Creator { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
}

public sealed class CheckoutProductData
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? ProductImageUrl { get; set; }
    public string? VariantName { get; set; }
    public int DisplayOrder { get; set; }
    public long? CustomPrice { get; set; }
    public long OriginalPrice { get; set; }
    public int Quantity { get; set; }
    public int? MaxQuantity { get; set; }
    public bool IsActive { get; set; }
}

public sealed class CheckoutCouponData
{
    public Guid Id { get; set; }
    public string Code { get; set; } = null!;
    public string? Name { get; set; }
    public CouponDiscountType DiscountType { get; set; }
    public long? DiscountFixedAmount { get; set; }
    public int? DiscountPercentage { get; set; }
    public CouponStatus Status { get; set; }
    public bool ApplyToAllCheckouts { get; set; }
    public int CurrentUses { get; set; }
    public int? MaxUses { get; set; }
}
