using safefy_api_core.Models.Enum;

namespace safefy_api_core.Interfaces;

public interface IAchievementService
{
    /// <summary>
    /// Checks all volume-based and transactional achievements for the user and awards any
    /// that have not been earned yet. Aggregates volume across ALL of the user's organizations.
    /// Should be called after every confirmed payment/payout.
    /// </summary>
    Task CheckAndAwardAsync(Guid userId, ApiEnvironment environment, CancellationToken ct = default);

    /// <summary>Computes the MerchantLevel for a given total volume (in cents).</summary>
    MerchantLevel ComputeLevel(long totalVolume);

    /// <summary>Returns how many cents are needed to reach the next level, or null if already Legend.</summary>
    long? VolumeTillNextLevel(long totalVolume);

    /// <summary>Progress 0-100 towards the current level's cap.</summary>
    int LevelProgress(long totalVolume);
}
