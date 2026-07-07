using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Database;

public class EmailLogEntry
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public Guid Id { get; set; }

    public Guid? UserId { get; set; }

    public Guid? MerchantId { get; set; }

    [Required]
    public string To { get; set; } = null!;

    [Required]
    public string Subject { get; set; } = null!;

    [Required]
    public string Template { get; set; } = null!;

    [Required]
    public string Status { get; set; } = null!;

    public string? ErrorMessage { get; set; }

    public string? Parameters { get; set; }

    public string? ServiceName { get; set; }

    public string? IpAddress { get; set; }

    public long? SendTimeMs { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EmailLogStatus
{
    Sent,
    Failed,
    Skipped
}
