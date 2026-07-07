using System.ComponentModel.DataAnnotations;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

public class PlatformBalanceCache
{
    [Key]
    public Guid Id { get; set; }

    public required ApiEnvironment Environment { get; set; }

    public required Guid AcquirerId { get; set; }

    public long AcquirerSettlement { get; set; }

    public long AcquirerPayoutsOut { get; set; }

    public long MerchantTotalAvailable { get; set; }

    public long MerchantTotalBlocked { get; set; }

    public long PlatformProfit { get; set; }

    public bool IsProcessing { get; set; }

    public DateTime? NextProcessAt { get; set; }

    public DateTime CalculatedAt { get; set; }

    public DateTime ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
