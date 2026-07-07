using swiftpay_api_core.Models.Enum;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace swiftpay_api_core.Models.Database;

public class Product : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid MerchantId { get; set; }

    public string Name { get; set; } = null!;
    public ProductType Type { get; set; }
    public string? ExternalId { get; set; }
    public string? ImageUrl { get; set; }
    [Column(TypeName = "jsonb")]
    public List<string> ImageUrls { get; set; } = [];
    public string? Description { get; set; }
    public string? Brand { get; set; }
    public long? Price { get; set; }
    public ProductStatus Status { get; set; } = ProductStatus.Active;
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;

    /// <summary>
    /// Quantidade em estoque (null = estoque infinito). Usado apenas para produtos SEM variantes.
    /// Para produtos com variantes, o estoque é controlado por Variant.StockQuantity.
    /// </summary>
    public int? StockQuantity { get; set; }

    public bool IsUnlimitedDigitalStock { get; set; }

    /// <summary>
    /// Quantidade de itens digitais a serem entregues por compra (apenas para ProductType.Digital)
    /// </summary>
    public int DigitalItemsPerPurchase { get; set; } = 1;

    /// <summary>
    /// Duração do serviço em minutos (apenas para ProductType.Service)
    /// </summary>
    public int? DurationMinutes { get; set; }

    /// <summary>
    /// Tipo de localização do serviço (apenas para ProductType.Service)
    /// </summary>
    public ServiceLocationType? LocationType { get; set; }

    // Relationships
    public Merchant Merchant { get; set; } = null!;
    public ICollection<Category> Categories { get; set; } = [];
    public ICollection<Variant> Variants { get; set; } = [];
    public ICollection<OrderItem> OrderItems { get; set; } = [];
    public ICollection<Coupon> Coupons { get; set; } = [];
    public ICollection<DigitalItem> DigitalItems { get; set; } = [];
}