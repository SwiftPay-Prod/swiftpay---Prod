using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

public class LevelConfig : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    public MerchantLevel Level { get; set; }
    public string DisplayName { get; set; } = null!;
    public long MinVolume { get; set; }
    public long? MaxVolume { get; set; }
    public string? BorderImageUrl { get; set; }
    public int SortOrder { get; set; }
}
