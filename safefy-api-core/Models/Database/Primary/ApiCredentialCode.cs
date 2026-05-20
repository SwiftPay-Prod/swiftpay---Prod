using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Models.Database;

public class ApiCredentialCode : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public Guid UserId { get; set; }
    public Guid? CredentialId { get; set; }
    public required string CodeHash { get; set; }
    public ApiCredentialCodeAction Action { get; set; }
    public ApiCredentialCodeStatus Status { get; set; } = ApiCredentialCodeStatus.Pending;
    public DateTime ExpiresAt { get; set; }

    public string? CredentialName { get; set; }
    public ApiEnvironment? CredentialEnvironment { get; set; }
    public string? CredentialAllowedIpRange { get; set; }

    [NotMapped]
    public bool IsExpired => DateTime.UtcNow > ExpiresAt;
    [NotMapped]
    public bool IsValid => Status == ApiCredentialCodeStatus.Pending && !IsExpired;

    public Merchant Merchant { get; set; } = null!;
    public User User { get; set; } = null!;
    public MerchantApiCredential? Credential { get; set; }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ApiCredentialCodeAction
{
    Create,
    Regenerate,
    Delete
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ApiCredentialCodeStatus
{
    Pending,
    Used,
    ExpiredByTime,
    ExpiredByNewCode
}
