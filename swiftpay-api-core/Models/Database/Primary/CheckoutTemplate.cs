using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Database;

public class CheckoutTemplate : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    
    /// <summary>
    /// Código único do template para identificação no frontend do checkout
    /// Usado como switch case no projeto do checkout
    /// </summary>
    [MaxLength(50)]
    public string Code { get; set; } = null!;
    
    /// <summary>
    /// Tipo do template
    /// </summary>
    public CheckoutTemplateType Type { get; set; }
    
    /// <summary>
    /// Nome do template para exibição
    /// </summary>
    [MaxLength(100)]
    public string Name { get; set; } = null!;
    
    /// <summary>
    /// Descrição curta do template (para cards de listagem)
    /// </summary>
    [MaxLength(200)]
    public string? ShortDescription { get; set; }
    
    /// <summary>
    /// Descrição completa do template (para modal de detalhes)
    /// </summary>
    [MaxLength(2000)]
    public string? FullDescription { get; set; }
    
    /// <summary>
    /// Para que tipo de negócio/uso o template é indicado
    /// </summary>
    [MaxLength(500)]
    public string? BestFor { get; set; }
    
    /// <summary>
    /// URL da imagem thumbnail para preview em cards
    /// </summary>
    public string? ThumbnailUrl { get; set; }
    
    /// <summary>
    /// URLs de imagens de preview do template (para modal de detalhes)
    /// Armazenado como JSONB
    /// </summary>
    [Column(TypeName = "jsonb")]
    public List<string> PreviewImages { get; set; } = [];
    
    /// <summary>
    /// Lista de recursos/features do template
    /// Armazenado como JSONB
    /// </summary>
    [Column(TypeName = "jsonb")]
    public List<string> Features { get; set; } = [];
    
    /// <summary>
    /// Modo de cobrança da taxa do template por transação.
    /// Null indica template gratuito (sem taxa adicional).
    /// </summary>
    public FeeChargeMode? FeeMode { get; set; }
    
    /// <summary>
    /// Taxa fixa do template em centavos (se FeeMode incluir FixedOnly ou FixedAndPercentage)
    /// </summary>
    public long FeeFixed { get; set; } = 0;
    
    /// <summary>
    /// Taxa percentual do template em basis points (150 = 1.5%)
    /// </summary>
    public int FeePercentage { get; set; } = 0;
    
    /// <summary>
    /// Se o template está disponível para uso
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// Contador de quantas vezes o template foi usado (histórico total)
    /// </summary>
    public int UsageCount { get; set; } = 0;
    
    /// <summary>
    /// Contador de checkouts ativos usando este template atualmente
    /// </summary>
    public int ActiveCheckouts { get; set; } = 0;
    
    /// <summary>
    /// Se o template suporta cupons de desconto
    /// </summary>
    public bool SupportsCoupons { get; set; } = true;
    
    /// <summary>
    /// Se o template suporta cálculo de frete (futuro)
    /// </summary>
    public bool SupportsShipping { get; set; } = false;
    
    /// <summary>
    /// Se o template suporta timer de urgência no checkout
    /// </summary>
    public bool SupportsTimer { get; set; } = false;
    
    /// <summary>
    /// Se o template suporta notificações de prova social (compras simuladas)
    /// </summary>
    public bool SupportsSocialProof { get; set; } = false;
    
    // ========== Suporte a Tracking ==========
    
    /// <summary>
    /// Se o template suporta Microsoft Clarity
    /// </summary>
    public bool SupportsClarity { get; set; } = false;
    
    /// <summary>
    /// Se o template suporta Facebook Pixel (inclui API de Conversões CAPI)
    /// </summary>
    public bool SupportsFacebookPixel { get; set; } = false;
    
    /// <summary>
    /// Se o template suporta Google Tag Manager
    /// </summary>
    public bool SupportsGoogleTagManager { get; set; } = false;
    
    /// <summary>
    /// Se o template suporta TikTok Pixel
    /// </summary>
    public bool SupportsTikTok { get; set; } = false;
    
    /// <summary>
    /// Se o template suporta Kwai Pixel
    /// </summary>
    public bool SupportsKwai { get; set; } = false;
    
    /// <summary>
    /// Se o template suporta Pinterest Tag
    /// </summary>
    public bool SupportsPinterest { get; set; } = false;
    
    /// <summary>
    /// Se o template suporta Taboola Pixel
    /// </summary>
    public bool SupportsTaboola { get; set; } = false;
    
    /// <summary>
    /// Se o template suporta Utmify
    /// </summary>
    public bool SupportsUtmify { get; set; } = false;
    
    /// <summary>
    /// Se o template suporta Otimizey
    /// </summary>
    public bool SupportsOtimizey { get; set; } = false;

    // Relationships
    public ICollection<Checkout> Checkouts { get; set; } = [];
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CheckoutTemplateType
{
    /// <summary>
    /// Link único para um pedido específico, expira após um tempo.
    /// Produtos pré-definidos, um cliente paga.
    /// </summary>
    SingleOrder,
    
    /// <summary>
    /// Link fixo/permanente com catálogo de produtos.
    /// Múltiplos clientes podem acessar e selecionar produtos.
    /// </summary>
    Catalog,
    
    /// <summary>
    /// Checkout transparente via API (futuro).
    /// Merchant usa seu próprio frontend.
    /// </summary>
    Transparent
}
