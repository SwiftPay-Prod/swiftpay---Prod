using safefy_api_core.Models.Enum;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace safefy_api_core.Models.Database;

public class Category : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid MerchantId { get; set; }

    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string? ExternalId { get; set; }
    public CategoryStatus Status { get; set; } = CategoryStatus.Active;
    
    /// <summary>
    /// Ambiente da categoria (Sandbox ou Production)
    /// </summary>
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;

    // Relationships
    public Merchant Merchant { get; set; } = null!;
    public ICollection<Product> Products { get; set; } = [];
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CategoryStatus
{
    Active,
    Inactive
}
