using safefy_api_core.Models.Enum;

namespace safefy_api_core.Constants;

public static class UserProgressionConstants
{
    // Ascending thresholds used by ranking, achievements, dynasty progression and public profile.
    public static readonly (MerchantLevel Level, long Min, long Max)[] LevelThresholds =
    [
        (MerchantLevel.Iron,          0L,                1_000_000L),
        (MerchantLevel.Bronze,        1_000_000L,        10_000_000L),
        (MerchantLevel.Silver,        10_000_000L,       25_000_000L),
        (MerchantLevel.GoldStart,     25_000_000L,       50_000_000L),
        (MerchantLevel.GoldPro,       50_000_000L,       100_000_000L),
        (MerchantLevel.Diamond,       100_000_000L,      200_000_000L),
        (MerchantLevel.PlatinumStart, 200_000_000L,      500_000_000L),
        (MerchantLevel.PlatinumPro,   500_000_000L,      1_000_000_000L),
        (MerchantLevel.Titanium,      1_000_000_000L,    2_500_000_000L),
        (MerchantLevel.Black,         2_500_000_000L,    5_000_000_000L),
        (MerchantLevel.Legend,        5_000_000_000L,    10_000_000_000L),
    ];
}