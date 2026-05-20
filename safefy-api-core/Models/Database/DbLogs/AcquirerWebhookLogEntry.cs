using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace safefy_api_core.Models.Database;

public class AcquirerWebhookLogEntry
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public Guid Id { get; set; }

    public Guid? AcquirerId { get; set; }

    [Required]
    public string AcquirerType { get; set; } = null!;

    [Required]
    public string AcquirerCode { get; set; } = null!;

    [Required]
    public string HttpMethod { get; set; } = null!;

    [Required]
    public string Endpoint { get; set; } = null!;

    public string? QueryString { get; set; }

    public string? RequestHeaders { get; set; }

    public string? RequestBody { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public string? Location { get; set; }

    public string? CorrelationId { get; set; }

    public string? ContentType { get; set; }

    public long? ContentLength { get; set; }

    public int? StatusCode { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
