using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Checkout.Get;

/// <summary>
/// Request para obter dados do checkout.
/// </summary>
public sealed class GetCheckoutRequest
{
    /// <summary>
    /// ShortId do checkout (na URL).
    /// </summary>
    public string ShortId { get; set; } = string.Empty;
}

/// <summary>
/// Response com dados do checkout para o frontend.
/// </summary>
public sealed class GetCheckoutResponse : BaseResponse<CheckoutPublicData>;

/// <summary>
/// Dados públicos do checkout para renderização no frontend.
/// </summary>
public sealed class CheckoutPublicData
{
    /// <summary>
    /// ShortId do checkout.
    /// </summary>
    public string ShortId { get; set; } = string.Empty;
    
    /// <summary>
    /// Nome do checkout.
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Descrição do checkout.
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Status atual do checkout.
    /// </summary>
    public CheckoutStatus Status { get; set; }
    
    /// <summary>
    /// Se o checkout está expirado.
    /// </summary>
    public bool IsExpired { get; set; }
    
    /// <summary>
    /// Motivo da expiração (se expirado).
    /// </summary>
    public string? ExpirationReason { get; set; }
    
    /// <summary>
    /// Ambiente do checkout.
    /// </summary>
    public ApiEnvironment Environment { get; set; }
    
    /// <summary>
    /// Informações do template.
    /// </summary>
    public CheckoutPublicTemplateData Template { get; set; } = null!;
    
    /// <summary>
    /// Configurações do checkout.
    /// </summary>
    public CheckoutPublicConfigData Config { get; set; } = null!;
    
    /// <summary>
    /// Informações do merchant.
    /// </summary>
    public CheckoutPublicMerchantData Merchant { get; set; } = null!;
    
    /// <summary>
    /// Produtos disponíveis no checkout.
    /// </summary>
    public List<CheckoutPublicProductData> Products { get; set; } = [];
    
    /// <summary>
    /// Cupons disponíveis (se template suporta).
    /// </summary>
    public List<CheckoutPublicCouponData> Coupons { get; set; } = [];
}

/// <summary>
/// Dados públicos do template.
/// </summary>
public sealed class CheckoutPublicTemplateData
{
    /// <summary>
    /// Código do template para switch case no frontend.
    /// </summary>
    public string Code { get; set; } = string.Empty;
    
    /// <summary>
    /// Tipo do template.
    /// </summary>
    public CheckoutTemplateType Type { get; set; }
    
    /// <summary>
    /// Nome do template.
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Se suporta cupons.
    /// </summary>
    public bool SupportsCoupons { get; set; }
    
    /// <summary>
    /// Se suporta frete.
    /// </summary>
    public bool SupportsShipping { get; set; }
    
    /// <summary>
    /// Se suporta timer.
    /// </summary>
    public bool SupportsTimer { get; set; }
    
    /// <summary>
    /// Se suporta prova social.
    /// </summary>
    public bool SupportsSocialProof { get; set; }
    
    /// <summary>
    /// Se suporta Microsoft Clarity.
    /// </summary>
    public bool SupportsClarity { get; set; }
    
    /// <summary>
    /// Se suporta Facebook Pixel.
    /// </summary>
    public bool SupportsFacebookPixel { get; set; }
    
    /// <summary>
    /// Se suporta Google Tag Manager.
    /// </summary>
    public bool SupportsGoogleTagManager { get; set; }
    
    /// <summary>
    /// Se suporta TikTok Pixel.
    /// </summary>
    public bool SupportsTikTok { get; set; }
    
    /// <summary>
    /// Se suporta Kwai Pixel.
    /// </summary>
    public bool SupportsKwai { get; set; }
    
    /// <summary>
    /// Se suporta Pinterest Tag.
    /// </summary>
    public bool SupportsPinterest { get; set; }
    
    /// <summary>
    /// Se suporta Taboola Pixel.
    /// </summary>
    public bool SupportsTaboola { get; set; }
    
    /// <summary>
    /// Se suporta Utmify.
    /// </summary>
    public bool SupportsUtmify { get; set; }
    
    /// <summary>
    /// Se suporta Otimizey.
    /// </summary>
    public bool SupportsOtimizey { get; set; }
}

/// <summary>
/// Configurações públicas do checkout.
/// </summary>
public sealed class CheckoutPublicConfigData
{
    /// <summary>
    /// PIX habilitado.
    /// </summary>
    public bool PixEnabled { get; set; }
    
    /// <summary>
    /// Cartão de crédito habilitado.
    /// </summary>
    public bool CreditCardEnabled { get; set; }
    
    /// <summary>
    /// Boleto habilitado.
    /// </summary>
    public bool BoletoEnabled { get; set; }
    
    /// <summary>
    /// Tempo de expiração do PIX em minutos.
    /// </summary>
    public int PixExpirationMinutes { get; set; }
    
    /// <summary>
    /// Método de pagamento pré-selecionado no checkout.
    /// </summary>
    public PaymentMethod? DefaultPaymentMethod { get; set; }
    
    /// <summary>
    /// Cupom habilitado.
    /// </summary>
    public bool CouponEnabled { get; set; }
    
    /// <summary>
    /// Frete habilitado.
    /// </summary>
    public bool ShippingEnabled { get; set; }

    /// <summary>
    /// Valor fixo do frete em centavos (se aplicável).
    /// </summary>
    public long? FixedShippingAmount { get; set; }
    
    /// <summary>
    /// Exige telefone do cliente.
    /// </summary>
    public bool RequireCustomerPhone { get; set; }
    
    /// <summary>
    /// Exige endereço do cliente.
    /// </summary>
    public bool RequireCustomerAddress { get; set; }
    
    /// <summary>
    /// Exige documento do cliente.
    /// </summary>
    public bool RequireCustomerDocument { get; set; }
    
    /// <summary>
    /// URL de sucesso.
    /// </summary>
    public string? SuccessUrl { get; set; }
    
    /// <summary>
    /// URL de cancelamento.
    /// </summary>
    public string? CancelUrl { get; set; }
    
    /// <summary>
    /// Cor primária.
    /// </summary>
    public string? PrimaryColor { get; set; }
    
    /// <summary>
    /// Cor secundária.
    /// </summary>
    public string? SecondaryColor { get; set; }
    
    /// <summary>
    /// Modo de cor (único ou gradiente).
    /// </summary>
    public CheckoutColorMode ColorMode { get; set; }
    
    /// <summary>
    /// URL do logo.
    /// </summary>
    public string? LogoUrl { get; set; }
    
    /// <summary>
    /// URL da imagem de fundo.
    /// </summary>
    public string? BackgroundImageUrl { get; set; }
    
    /// <summary>
    /// URL do favicon.
    /// </summary>
    public string? FaviconUrl { get; set; }
    
    /// <summary>
    /// Mensagem do cabeçalho.
    /// </summary>
    public string? HeaderMessage { get; set; }
    
    /// <summary>
    /// Mensagem secundária do cabeçalho (subtítulo).
    /// </summary>
    public string? SubHeaderMessage { get; set; }
    
    /// <summary>
    /// Mensagem do rodapé.
    /// </summary>
    public string? FooterMessage { get; set; }
    
    /// <summary>
    /// Mensagem de sucesso.
    /// </summary>
    public string? SuccessMessage { get; set; }
    
    /// <summary>
    /// Título da página.
    /// </summary>
    public string? PageTitle { get; set; }

    /// <summary>
    /// Exibe o timer no checkout.
    /// </summary>
    public bool ShowTimer { get; set; }

    /// <summary>
    /// Tempo inicial do timer em minutos.
    /// </summary>
    public int? TimerMinutes { get; set; }

    /// <summary>
    /// Texto exibido junto ao timer.
    /// </summary>
    public string? TimerText { get; set; }
    
    /// <summary>
    /// Texto exibido após o timer expirar.
    /// </summary>
    public string? TimerExpiredText { get; set; }
    
    /// <summary>
    /// Configurações de prova social.
    /// </summary>
    public CheckoutPublicSocialProofData? SocialProof { get; set; }
    
    /// <summary>
    /// Configurações de tracking/analytics.
    /// </summary>
    public CheckoutPublicTrackingData? Tracking { get; set; }
    
    /// <summary>
    /// WhatsApp habilitado para contato.
    /// </summary>
    public bool ContactWhatsAppEnabled { get; set; }
    
    /// <summary>
    /// Número do WhatsApp para contato.
    /// </summary>
    public string? ContactWhatsAppNumber { get; set; }
    
    /// <summary>
    /// Telegram habilitado para contato.
    /// </summary>
    public bool ContactTelegramEnabled { get; set; }
    
    /// <summary>
    /// Username do Telegram para contato.
    /// </summary>
    public string? ContactTelegramUsername { get; set; }
    
    /// <summary>
    /// E-mail habilitado para contato.
    /// </summary>
    public bool ContactEmailEnabled { get; set; }
    
    /// <summary>
    /// E-mail para contato.
    /// </summary>
    public string? ContactEmail { get; set; }
}

/// <summary>
/// Configurações de prova social para o checkout.
/// </summary>
public sealed class CheckoutPublicSocialProofData
{
    /// <summary>
    /// Se está habilitado.
    /// </summary>
    public bool Enabled { get; set; }
    
    /// <summary>
    /// Intervalo entre notificações em segundos.
    /// </summary>
    public int IntervalSeconds { get; set; }
    
    /// <summary>
    /// Duração de exibição em segundos.
    /// </summary>
    public int DurationSeconds { get; set; }
    
    /// <summary>
    /// Posição na tela (TopLeft, TopRight, BottomLeft, BottomRight).
    /// </summary>
    public string Position { get; set; } = "BottomLeft";
    
    /// <summary>
    /// Lista de notificações.
    /// </summary>
    public List<CheckoutPublicSocialProofNotification> Notifications { get; set; } = [];
}

/// <summary>
/// Notificação de prova social.
/// </summary>
public sealed class CheckoutPublicSocialProofNotification
{
    /// <summary>
    /// Nome do cliente.
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Localização do cliente.
    /// </summary>
    public string Location { get; set; } = string.Empty;
    
    /// <summary>
    /// Ação realizada.
    /// </summary>
    public string Action { get; set; } = string.Empty;
}

/// <summary>
/// Configurações de tracking/analytics públicas para o checkout.
/// </summary>
public sealed class CheckoutPublicTrackingData
{
    /// <summary>
    /// Configuração do Microsoft Clarity.
    /// </summary>
    public CheckoutPublicClarityTracking? Clarity { get; set; }
    
    /// <summary>
    /// Configuração do Facebook Pixel.
    /// </summary>
    public CheckoutPublicFacebookPixelTracking? FacebookPixel { get; set; }
    
    /// <summary>
    /// Configuração do Google Tag Manager.
    /// </summary>
    public CheckoutPublicGoogleTagManagerTracking? GoogleTagManager { get; set; }
    
    /// <summary>
    /// Configuração do TikTok Pixel.
    /// </summary>
    public CheckoutPublicTikTokTracking? TikTok { get; set; }
    
    /// <summary>
    /// Configuração do Kwai Pixel.
    /// </summary>
    public CheckoutPublicKwaiTracking? Kwai { get; set; }
    
    /// <summary>
    /// Configuração do Pinterest Tag.
    /// </summary>
    public CheckoutPublicPinterestTracking? Pinterest { get; set; }
    
    /// <summary>
    /// Configuração do Taboola Pixel.
    /// </summary>
    public CheckoutPublicTaboolaTracking? Taboola { get; set; }
    
    /// <summary>
    /// Configuração do Utmify.
    /// </summary>
    public CheckoutPublicUtmifyTracking? Utmify { get; set; }
    
    /// <summary>
    /// Configuração do Otimizey.
    /// </summary>
    public CheckoutPublicOtimizeyTracking? Otimizey { get; set; }
}

/// <summary>
/// Configuração pública do Microsoft Clarity.
/// </summary>
public sealed class CheckoutPublicClarityTracking
{
    public bool Enabled { get; set; }
    public string? ProjectId { get; set; }
}

/// <summary>
/// Configuração pública do Facebook Pixel.
/// </summary>
public sealed class CheckoutPublicFacebookPixelTracking
{
    public bool Enabled { get; set; }
    public string? PixelId { get; set; }
    public string? AccessToken { get; set; }
    public string? TestEventCode { get; set; }
    public bool EnableDeduplication { get; set; }
}

/// <summary>
/// Configuração pública do Google Tag Manager.
/// </summary>
public sealed class CheckoutPublicGoogleTagManagerTracking
{
    public bool Enabled { get; set; }
    public string? ContainerId { get; set; }
}

/// <summary>
/// Configuração pública do TikTok Pixel.
/// </summary>
public sealed class CheckoutPublicTikTokTracking
{
    public bool Enabled { get; set; }
    public string? PixelId { get; set; }
    public string? AccessToken { get; set; }
}

/// <summary>
/// Configuração pública do Kwai Pixel.
/// </summary>
public sealed class CheckoutPublicKwaiTracking
{
    public bool Enabled { get; set; }
    public string? PixelId { get; set; }
}

/// <summary>
/// Configuração pública do Pinterest Tag.
/// </summary>
public sealed class CheckoutPublicPinterestTracking
{
    public bool Enabled { get; set; }
    public string? TagId { get; set; }
}

/// <summary>
/// Configuração pública do Taboola Pixel.
/// </summary>
public sealed class CheckoutPublicTaboolaTracking
{
    public bool Enabled { get; set; }
    public string? AccountId { get; set; }
}

/// <summary>
/// Configuração pública do Utmify.
/// </summary>
public sealed class CheckoutPublicUtmifyTracking
{
    public bool Enabled { get; set; }
    public string? PixelId { get; set; }
}

/// <summary>
/// Configuração pública do Otimizey.
/// </summary>
public sealed class CheckoutPublicOtimizeyTracking
{
    public bool Enabled { get; set; }
    public string? PixelId { get; set; }
}

/// <summary>
/// Dados públicos do merchant.
/// </summary>
public sealed class CheckoutPublicMerchantData
{
    /// <summary>
    /// Nome fantasia do merchant.
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// URL do logo do merchant.
    /// </summary>
    public string? LogoUrl { get; set; }
}

/// <summary>
/// Dados públicos do produto no checkout.
/// </summary>
public sealed class CheckoutPublicProductData
{
    /// <summary>
    /// ID do produto.
    /// </summary>
    public Guid ProductId { get; set; }
    
    /// <summary>
    /// ID da variante (se aplicável).
    /// </summary>
    public Guid? VariantId { get; set; }
    
    /// <summary>
    /// Nome do produto.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    public ProductType Type { get; set; }
    
    /// <summary>
    /// Descrição do produto.
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Nome da variante (se aplicável).
    /// </summary>
    public string? VariantName { get; set; }
    
    /// <summary>
    /// URL da imagem.
    /// </summary>
    public string? ImageUrl { get; set; }
    
    /// <summary>
    /// URLs das imagens do produto.
    /// </summary>
    public List<string>? ImageUrls { get; set; }
    
    /// <summary>
    /// Preço em centavos (customizado ou do produto).
    /// </summary>
    public long Price { get; set; }
    
    /// <summary>
    /// Quantidade pré-definida ou mínima.
    /// </summary>
    public int Quantity { get; set; }
    
    /// <summary>
    /// Quantidade máxima permitida (null = ilimitado).
    /// </summary>
    public int? MaxQuantity { get; set; }
    
    /// <summary>
    /// Ordem de exibição.
    /// </summary>
    public int DisplayOrder { get; set; }
}

/// <summary>
/// Dados públicos do cupom no checkout.
/// </summary>
public sealed class CheckoutPublicCouponData
{
    /// <summary>
    /// Código do cupom.
    /// </summary>
    public string Code { get; set; } = string.Empty;
    
    /// <summary>
    /// Nome/descrição do cupom.
    /// </summary>
    public string? Name { get; set; }
    
    /// <summary>
    /// Tipo de desconto.
    /// </summary>
    public CouponDiscountType DiscountType { get; set; }
    
    /// <summary>
    /// Percentual de desconto (se tipo percentual).
    /// </summary>
    public int? DiscountPercentage { get; set; }
    
    /// <summary>
    /// Valor fixo de desconto em centavos (se tipo fixo).
    /// </summary>
    public long? DiscountFixedAmount { get; set; }
    
    /// <summary>
    /// Valor mínimo do pedido para usar o cupom.
    /// </summary>
    public long? MinOrderAmount { get; set; }
    
    /// <summary>
    /// Valor máximo de desconto (se percentual).
    /// </summary>
    public long? MaxDiscountAmount { get; set; }
}
