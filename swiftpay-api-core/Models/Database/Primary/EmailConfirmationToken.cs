using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Database;

public class EmailConfirmationToken : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public required string TokenHash { get; set; }
    public EmailConfirmationTokenStatus Status { get; set; } = EmailConfirmationTokenStatus.Pending;
    public DateTime ExpiresAt { get; set; }

    [NotMapped]
    public bool IsExpired => DateTime.UtcNow > ExpiresAt;
    [NotMapped]
    public bool IsValid => Status == EmailConfirmationTokenStatus.Pending && !IsExpired;

    public User User { get; set; } = null!;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EmailConfirmationTokenStatus
{
    Pending,
    Used,
    ExpiredByTime,
    ExpiredByNewToken
}
