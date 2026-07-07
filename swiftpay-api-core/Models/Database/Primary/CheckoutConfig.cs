using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

/// <summary>
/// Configurações funcionais e visuais do checkout.
/// Cada checkout tem uma única configuração (1:1).
/// </summary>
public class CheckoutConfig : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    
    public Guid CheckoutId { get; set; }
    
    // ========== Configurações de Pagamento ==========
    
    /// <summary>
    /// Habilita pagamento via PIX
    /// </summary>
    public bool PixEnabled { get; set; } = true;
    
    /// <summary>
    /// Habilita pagamento via cartão de crédito (futuro)
    /// </summary>
    public bool CreditCardEnabled { get; set; } = false;
    
    /// <summary>
    /// Habilita pagamento via boleto (futuro)
    /// </summary>
    public bool BoletoEnabled { get; set; } = false;
    
    /// <summary>
    /// Tempo de expiração do PIX em minutos
    /// </summary>
    public int PixExpirationMinutes { get; set; } = 30;
    /// <summary>
    /// Método de pagamento pré-selecionado no checkout.
    /// Null significa que nenhum método é pré-selecionado (cliente escolhe).
    /// </summary>
    public PaymentMethod? DefaultPaymentMethod { get; set; }
    
    // ========== Configurações de Funcionalidades ==========
    
    /// <summary>
    /// Habilita uso de cupons de desconto
    /// </summary>
    public bool CouponEnabled { get; set; } = true;
    
    /// <summary>
    /// Habilita cálculo de frete
    /// </summary>
    public bool ShippingEnabled { get; set; } = false;
    
    /// <summary>
    /// Valor fixo de frete em centavos (quando ShippingEnabled = true)
    /// </summary>
    public long? FixedShippingAmount { get; set; }
    
    /// <summary>
    /// Exige informações básicas do cliente (nome, email)
    /// DEPRECATED: Campo mantido para compatibilidade com EF migrations. Nome e email são sempre obrigatórios.
    /// </summary>
    public bool RequireCustomerInfo { get; set; } = true;
    
    /// <summary>
    /// Exige telefone do cliente
    /// </summary>
    public bool RequireCustomerPhone { get; set; } = false;
    
    /// <summary>
    /// Exige endereço do cliente
    /// </summary>
    public bool RequireCustomerAddress { get; set; } = false;
    
    /// <summary>
    /// Exige documento do cliente (CPF/CNPJ)
    /// </summary>
    public bool RequireCustomerDocument { get; set; } = false;
    
    /// <summary>
    /// Tempo de expiração da reserva de estoque em minutos.
    /// Quando o cliente inicia o checkout, o estoque é reservado por este período.
    /// Padrão: 15 minutos. O backend usa 5 minutos a mais como margem de segurança.
    /// </summary>
    public int ReservationExpirationMinutes { get; set; } = 15;
    
    // ========== URLs de Redirecionamento ==========
    
    /// <summary>
    /// URL de redirecionamento após pagamento bem-sucedido
    /// </summary>
    [MaxLength(500)]
    public string? SuccessUrl { get; set; }
    
    /// <summary>
    /// URL de redirecionamento após cancelamento
    /// </summary>
    [MaxLength(500)]
    public string? CancelUrl { get; set; }
    
    /// <summary>
    /// URL de callback/webhook para notificações
    /// </summary>
    [MaxLength(500)]
    public string? CallbackUrl { get; set; }
    
    // ========== Customização Visual ==========
    
    /// <summary>
    /// Cor primária em hexadecimal (ex: #FF5500)
    /// </summary>
    [MaxLength(7)]
    public string? PrimaryColor { get; set; } = "#1886ed";
    
    /// <summary>
    /// Cor secundária em hexadecimal
    /// </summary>
    [MaxLength(7)]
    public string? SecondaryColor { get; set; }
    
    /// <summary>
    /// Modo de cor do checkout (único ou gradiente)
    /// </summary>
    public CheckoutColorMode ColorMode { get; set; } = CheckoutColorMode.Single;
    
    /// <summary>
    /// URL do logo do merchant
    /// </summary>
    [MaxLength(500)]
    public string? LogoUrl { get; set; }
    
    /// <summary>
    /// URL da imagem de fundo
    /// </summary>
    [MaxLength(500)]
    public string? BackgroundImageUrl { get; set; }
    
    /// <summary>
    /// URL do favicon
    /// </summary>
    [MaxLength(500)]
    public string? FaviconUrl { get; set; }
    
    // ========== Mensagens Customizadas ==========
    
    /// <summary>
    /// Mensagem exibida no topo do checkout
    /// </summary>
    [MaxLength(500)]
    public string? HeaderMessage { get; set; }
    
    /// <summary>
    /// Mensagem secundária exibida abaixo do header (subtítulo)
    /// </summary>
    [MaxLength(500)]
    public string? SubHeaderMessage { get; set; }
    
    /// <summary>
    /// Mensagem exibida no rodapé do checkout
    /// </summary>
    [MaxLength(500)]
    public string? FooterMessage { get; set; }
    
    /// <summary>
    /// Mensagem exibida após pagamento bem-sucedido
    /// </summary>
    [MaxLength(500)]
    public string? SuccessMessage { get; set; }
    
    /// <summary>
    /// Título da página de checkout
    /// </summary>
    [MaxLength(100)]
    public string? PageTitle { get; set; }
    
    // ========== Configurações do Timer ==========
    
    /// <summary>
    /// Exibe timer de contagem regressiva no checkout
    /// </summary>
    public bool ShowTimer { get; set; } = false;
    
    /// <summary>
    /// Tempo inicial do timer em minutos
    /// </summary>
    public int? TimerMinutes { get; set; }
    
    /// <summary>
    /// Texto exibido junto ao timer (ex: "Oferta expira em")
    /// </summary>
    [MaxLength(200)]
    public string? TimerText { get; set; }
    
    /// <summary>
    /// Texto exibido após o timer expirar (ex: "Oferta expirada!")
    /// </summary>
    [MaxLength(200)]
    public string? TimerExpiredText { get; set; }
    
    // ========== Configurações de Prova Social ==========
    
    /// <summary>
    /// Habilita notificações de prova social (compras simuladas)
    /// </summary>
    public bool SocialProofEnabled { get; set; } = false;
    
    /// <summary>
    /// Configurações de prova social em formato JSON
    /// Contém: intervalSeconds, notifications (array de name, location, action)
    /// </summary>
    [Column(TypeName = "jsonb")]
    public SocialProofSettings? SocialProofSettings { get; set; }
    
    // ========== Configurações de Tracking ==========
    
    /// <summary>
    /// Configurações de tracking/rastreamento (pixels, tags, etc.)
    /// Armazenado como JSONB com configurações de cada plataforma habilitada
    /// </summary>
    [Column(TypeName = "jsonb")]
    public TrackingSettings? TrackingSettings { get; set; }
    
    // ========== Configurações de SEO ==========
    
    /// <summary>
    /// Configurações de SEO/Open Graph/Twitter Card do checkout.
    /// Armazenado como JSONB.
    /// </summary>
    [Column(TypeName = "jsonb")]
    public SeoConfig? Seo { get; set; }
    
    // ========== Configurações de Contato ==========
    
    /// <summary>
    /// Habilita botão de contato via WhatsApp
    /// </summary>
    public bool ContactWhatsAppEnabled { get; set; } = false;
    
    /// <summary>
    /// Número do WhatsApp em formato internacional (ex: 5511999999999)
    /// </summary>
    [MaxLength(20)]
    public string? ContactWhatsAppNumber { get; set; }
    
    /// <summary>
    /// Habilita botão de contato via Telegram
    /// </summary>
    public bool ContactTelegramEnabled { get; set; } = false;
    
    /// <summary>
    /// Username do Telegram (sem @)
    /// </summary>
    [MaxLength(50)]
    public string? ContactTelegramUsername { get; set; }
    
    /// <summary>
    /// Habilita botão de contato via Email
    /// </summary>
    public bool ContactEmailEnabled { get; set; } = false;
    
    /// <summary>
    /// Email para contato
    /// </summary>
    [MaxLength(255)]
    public string? ContactEmail { get; set; }
    
    // Relationships
    public Checkout Checkout { get; set; } = null!;
}
