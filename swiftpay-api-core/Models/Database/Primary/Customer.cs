using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

public class Customer : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public string? ExternalId { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Document { get; set; }
    public CustomerDocumentType? DocumentType { get; set; }
    public string? Phone { get; set; }
    public CustomerStatus Status { get; set; } = CustomerStatus.Active;
    public string? Metadata { get; set; }
    
    // Address fields
    [MaxLength(200)]
    public string? AddressStreet { get; set; }
    [MaxLength(20)]
    public string? AddressNumber { get; set; }
    [MaxLength(100)]
    public string? AddressComplement { get; set; }
    [MaxLength(100)]
    public string? AddressNeighborhood { get; set; }
    [MaxLength(100)]
    public string? AddressCity { get; set; }
    [MaxLength(50)]
    public string? AddressState { get; set; }
    [MaxLength(20)]
    public string? AddressPostalCode { get; set; }
    [MaxLength(50)]
    public string? AddressCountry { get; set; }
    
    /// <summary>
    /// Ambiente do cliente (Sandbox ou Production)
    /// </summary>
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;

    // Relationships
    public Merchant Merchant { get; set; } = null!;
    public ICollection<Payment> Payments { get; set; } = [];
    public ICollection<Order> Orders { get; set; } = [];
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CustomerDocumentType
{
    CPF,
    CNPJ
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CustomerStatus
{
    Active,
    Inactive
}
