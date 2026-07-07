using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Database;

public class PushToken : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    
    public Guid UserId { get; set; }
    
    public string? DeviceId { get; set; }
    
    public string Token { get; set; } = null!;
    
    public PushTokenPlatform Platform { get; set; }
    
    public string? DeviceName { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public DateTime? LastUsedAt { get; set; }
    
    // Navigation
    public User User { get; set; } = null!;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PushTokenPlatform
{
    Web,
    Ios,
    Android
}
