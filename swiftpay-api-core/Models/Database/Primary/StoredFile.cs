using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

public class StoredFile : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(500)]
    public string ObjectName { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string OriginalFileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string ContentType { get; set; } = string.Empty;

    public long Size { get; set; }

    public bool IsPublic { get; set; }

    public UploadFolder Folder { get; set; }

    public Guid OwnerId { get; set; }

    public Guid UploaderId { get; set; }

    [MaxLength(2000)]
    public string? CachedUrl { get; set; }

    public DateTime? CachedUrlExpiresAt { get; set; }

    public User Uploader { get; set; } = null!;

    public bool IsUrlExpired() => 
        IsPublic 
            ? CachedUrl == null 
            : CachedUrlExpiresAt == null || DateTime.UtcNow >= CachedUrlExpiresAt;
}
