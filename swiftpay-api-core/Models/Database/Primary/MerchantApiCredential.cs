using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

public class MerchantApiCredential : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public string? Name { get; set; }
    public string ClientId { get; set; } = null!;
    public string ClientSecretHash { get; set; } = null!;

    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;
    public MerchantApiCredentialStatus Status { get; set; } = MerchantApiCredentialStatus.Active;
    public int SecretVersion { get; set; } = 1;

    public string? AllowedIpRange { get; set; }

    // Relationships
    public Merchant Merchant { get; set; } = null!;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MerchantApiCredentialStatus
{
    Active,
    Inactive,
    Revoked
}
