using System.Text.Json.Serialization;
using safefy_api.Endpoints.Models;
using safefy_api.Endpoints.Users.ReadPublicProfile;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Users.Ranking.ReadRanking;

public sealed class ReadRankingRequest
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public RankingType Type { get; set; } = RankingType.Volume;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public RankingPeriod Period { get; set; } = RankingPeriod.Weekly;

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public sealed class ReadRankingResponse : BaseResponse<ReadRankingData>;

public sealed class ReadRankingData
{
    public List<RankingEntryData> Items { get; set; } = [];
    public int TotalItems { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public RankingType Type { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public RankingPeriod Period { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public RankingProcessingStatus Status { get; set; }

    public DateTime? CalculatedAt { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
}

public sealed class RankingEntryData
{
    public Guid UserId { get; set; }
    public string? UserName { get; set; }
    public string? ProfileImageUrl { get; set; }
    public PublicProfileData? UserPublicProfile { get; set; }
    public long Volume { get; set; }
    public int Position { get; set; }
    public int? PreviousPosition { get; set; }
    public int PositionChange { get; set; }
    public int TotalReferrals { get; set; }
    public long TotalCommission { get; set; }
}
