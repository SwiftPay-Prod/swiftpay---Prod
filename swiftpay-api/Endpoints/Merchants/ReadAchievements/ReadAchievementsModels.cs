using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.ReadAchievements;

public sealed class ReadAchievementsRequest
{
    public Guid MerchantId { get; set; }
}

public sealed class ReadAchievementsResponse : BaseResponse<ReadAchievementsData>;

public sealed class ReadAchievementsData
{
    public MerchantLevelData LevelInfo { get; set; } = null!;
    public List<MerchantAchievementItemData> Achievements { get; set; } = [];
    public List<LevelBorderData> LevelBorders { get; set; } = [];
    public List<Guid> SelectedEmblemIds { get; set; } = [];
    public string? SelectedBorderLevel { get; set; }
    public string? SelectedBorderImageUrl { get; set; }
}

public sealed class LevelBorderData
{
    public string Level { get; set; } = null!;
    public string DisplayName { get; set; } = null!;
    public string? BorderImageUrl { get; set; }
}

public sealed class MerchantLevelData
{
    public string Current { get; set; } = null!;
    public string CurrentDisplayName { get; set; } = null!;
    public string? NextLevel { get; set; }
    public string? NextLevelDisplayName { get; set; }
    public long TotalVolume { get; set; }
    public long MinThreshold { get; set; }
    public long? MaxThreshold { get; set; }
    public int Progress { get; set; }
    public string? BorderImageUrl { get; set; }
}

public sealed class MerchantAchievementItemData
{
    public Guid Id { get; set; }
    public string Key { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Subtitle { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string ImageUrl { get; set; } = null!;
    public string Type { get; set; } = null!;
    public long? ThresholdAmount { get; set; }
    public int SortOrder { get; set; }
    public bool IsEarned { get; set; }
    public DateTime? EarnedAt { get; set; }
}
