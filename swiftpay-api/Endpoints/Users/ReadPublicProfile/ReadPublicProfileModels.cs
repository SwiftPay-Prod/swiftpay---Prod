using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Users.ReadPublicProfile;

public sealed class ReadPublicProfileRequest
{
    public Guid UserId { get; set; }
}

public sealed class ReadPublicProfileResponse : BaseResponse<PublicProfileData>;

public sealed class PublicProfileData
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Bio { get; set; }
    public string? SocialLinks { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? BannerImageUrl { get; set; }
    public string? SelectedBorderImageUrl { get; set; }
    public string? SelectedBorderLevel { get; set; }
    public PublicProfileLevelInfoData? LevelInfo { get; set; }
    public int EarnedCount { get; set; }
    public int TotalAchievements { get; set; }
    public List<PublicProfileEmblemData> SelectedEmblems { get; set; } = [];
}

public sealed class PublicProfileLevelInfoData
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

public sealed class PublicProfileEmblemData
{
    public Guid Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? EarnedAt { get; set; }
}
