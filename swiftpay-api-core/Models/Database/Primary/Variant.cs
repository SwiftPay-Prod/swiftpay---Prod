using safefy_api_core.Models.Enum;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace safefy_api_core.Models.Database;

public class Variant : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid ProductId { get; set; }

    public string Name { get; set; } = null!;
    public string? ExternalId { get; set; }
    public string? SKU { get; set; }
    public long Price { get; set; }
    public int? StockQuantity { get; set; }
    public string? ImageUrl { get; set; }
    public VariantStatus Status { get; set; } = VariantStatus.Active;

    // Relationships
    public Product Product { get; set; } = null!;
    public ICollection<OrderItem> OrderItems { get; set; } = [];
}
