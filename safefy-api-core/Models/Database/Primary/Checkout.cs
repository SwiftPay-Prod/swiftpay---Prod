using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Models.Database;

public class Checkout : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    
    public Guid MerchantId { get; set; }
    
    public Guid? CheckoutTemplateId { get; set; }
    
    /// <summary>
    /// Nome do checkout para identificação no painel
    /// </summary>
    [MaxLength(100)]
    public string Name { get; set; } = null!;
    
    /// <summary>
    /// Descrição interna do checkout
    /// </summary>
    [MaxLength(500)]
    public string? Description { get; set; }
    
    /// <summary>
    /// Slug para URL amigável (ex: minha-loja, black-friday)
    /// </summary>
    [MaxLength(100)]
    public string Slug { get; set; } = null!;
    
    /// <summary>
    /// Identificador único curto para URL do checkout (ex: abc123xyz)
    /// Gerado automaticamente na criação do checkout
    /// </summary>
    [MaxLength(12)]
    public string ShortId { get; set; } = null!;
    
    /// <summary>
    /// Status do checkout
    /// </summary>
    public CheckoutStatus Status { get; set; } = CheckoutStatus.Draft;
    
    /// <summary>
    /// Ambiente do checkout (Sandbox ou Production)
    /// </summary>
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;
    
    /// <summary>
    /// Indica se o onboarding do checkout foi concluído
    /// </summary>
    public bool OnboardingCompleted { get; set; } = false;
    
    /// <summary>
    /// Etapa atual do onboarding (0 = não iniciado, 1+ = etapa atual)
    /// </summary>
    public int OnboardingStep { get; set; } = 0;

    // Relationships
    public Merchant Merchant { get; set; } = null!;
    public CheckoutTemplate? CheckoutTemplate { get; set; }
    public CheckoutConfig? Config { get; set; }
    public ICollection<CheckoutProduct> CheckoutProducts { get; set; } = [];
    public ICollection<Coupon> Coupons { get; set; } = [];
    public ICollection<Order> Orders { get; set; } = [];
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CheckoutStatus
{
    /// <summary>
    /// Checkout em rascunho, ainda não publicado
    /// </summary>
    Draft,
    
    /// <summary>
    /// Checkout ativo e acessível
    /// </summary>
    Active,
    
    /// <summary>
    /// Checkout pausado temporariamente
    /// </summary>
    Paused,
    
    /// <summary>
    /// Checkout arquivado (não pode mais ser usado)
    /// </summary>
    Archived,
    
    /// <summary>
    /// Checkout expirado (para SingleOrder)
    /// </summary>
    Expired
}
