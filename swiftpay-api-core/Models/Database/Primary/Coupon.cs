using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

public class Coupon : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    
    public Guid MerchantId { get; set; }
    
    /// <summary>
    /// Código do cupom (ex: DESCONTO10, BLACKFRIDAY)
    /// </summary>
    [MaxLength(50)]
    public string Code { get; set; } = null!;
    
    /// <summary>
    /// Nome amigável do cupom para exibição no painel
    /// </summary>
    [MaxLength(100)]
    public string? Name { get; set; }
    
    /// <summary>
    /// Descrição interna do cupom
    /// </summary>
    [MaxLength(500)]
    public string? Description { get; set; }
    
    /// <summary>
    /// Tipo de desconto (valor fixo ou percentual)
    /// </summary>
    public CouponDiscountType DiscountType { get; set; }
    
    /// <summary>
    /// Valor do desconto em centavos (quando DiscountType = FixedAmount)
    /// </summary>
    public long? DiscountFixedAmount { get; set; }
    
    /// <summary>
    /// Percentual do desconto em basis points (quando DiscountType = Percentage, ex: 1000 = 10%)
    /// </summary>
    public int? DiscountPercentage { get; set; }
    
    /// <summary>
    /// Valor máximo de desconto em centavos (quando DiscountType = Percentage)
    /// </summary>
    public long? MaxDiscountAmount { get; set; }
    
    /// <summary>
    /// Valor mínimo do pedido em centavos para aplicar o cupom
    /// </summary>
    public long? MinOrderAmount { get; set; }
    
    /// <summary>
    /// Máximo de usos do cupom (null = ilimitado)
    /// </summary>
    public int? MaxUses { get; set; }
    
    /// <summary>
    /// Quantidade de vezes que o cupom já foi utilizado
    /// </summary>
    public int CurrentUses { get; set; } = 0;
    
    /// <summary>
    /// Máximo de usos por cliente (null = ilimitado)
    /// </summary>
    public int? MaxUsesPerCustomer { get; set; }
    
    /// <summary>
    /// Data de início da validade
    /// </summary>
    public DateTime? ValidFrom { get; set; }
    
    /// <summary>
    /// Data de término da validade
    /// </summary>
    public DateTime? ValidUntil { get; set; }
    
    /// <summary>
    /// Status do cupom
    /// </summary>
    public CouponStatus Status { get; set; } = CouponStatus.Active;
    
    /// <summary>
    /// Se true, o cupom se aplica a todos os produtos do merchant
    /// </summary>
    public bool ApplyToAllProducts { get; set; } = true;
    
    /// <summary>
    /// Se true, o cupom se aplica a todos os checkouts do merchant
    /// </summary>
    public bool ApplyToAllCheckouts { get; set; } = true;
    
    /// <summary>
    /// Ambiente do cupom (Sandbox ou Production)
    /// </summary>
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;

    // Relationships
    public Merchant Merchant { get; set; } = null!;
    public ICollection<Product> Products { get; set; } = [];
    public ICollection<Checkout> Checkouts { get; set; } = [];
    public ICollection<Order> Orders { get; set; } = [];
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CouponDiscountType
{
    /// <summary>
    /// Desconto de valor fixo em centavos
    /// </summary>
    FixedAmount,
    
    /// <summary>
    /// Desconto em percentual (basis points: 1000 = 10%)
    /// </summary>
    Percentage
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CouponStatus
{
    /// <summary>
    /// Cupom ativo e pode ser utilizado
    /// </summary>
    Active,
    
    /// <summary>
    /// Cupom desativado manualmente
    /// </summary>
    Inactive,
    
    /// <summary>
    /// Cupom expirou (ValidUntil passou)
    /// </summary>
    Expired,
    
    /// <summary>
    /// Cupom atingiu o limite máximo de usos
    /// </summary>
    Exhausted
}
