using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Models.Database;

public class MerchantBalance : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid MerchantId { get; set; }
    
    /// <summary>
    /// Ambiente do saldo (Sandbox ou Production)
    /// </summary>
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;

    public long LifetimeVolume { get; set; }
    public long LifetimePayouts { get; set; }
    public long LifetimeRefunds { get; set; }
    public long LifetimeFeesPaid { get; set; }

    public long VolumeToday { get; set; }
    public DateOnly TodayDate { get; set; }

    public long VolumeThisWeek { get; set; }
    public int WeekNumber { get; set; }
    public int WeekYear { get; set; }

    public long VolumeThisMonth { get; set; }
    public int MonthNumber { get; set; }
    public int MonthYear { get; set; }

    public Merchant Merchant { get; set; } = null!;
}
