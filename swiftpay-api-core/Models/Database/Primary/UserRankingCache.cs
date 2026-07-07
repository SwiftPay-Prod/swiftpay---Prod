using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

public class UserRankingCache : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public RankingPeriod Period { get; set; }

    public ApiEnvironment Environment { get; set; }

    public long Volume { get; set; }

    public int Position { get; set; }
    public int? PreviousPosition { get; set; }
    public int PositionChange { get; set; }

    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public DateTime CalculatedAt { get; set; }

    public User User { get; set; } = null!;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum RankingType
{
    Volume,
    Referral
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum RankingPeriod
{
    Weekly,
    Monthly,
    Annual
}
