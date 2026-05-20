using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Models.Database;

public sealed class SystemInternalConfig : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    [MaxLength(120)]
    public string Key { get; set; } = string.Empty;

    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;

    [Column(TypeName = "jsonb")]
    public string JsonValue { get; set; } = "{}";

    public Guid UpdatedByUserId { get; set; }
}
