using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Admin.Achievements.BackfillAchievements;

public sealed class BackfillAchievementsResponse : BaseResponse<BackfillAchievementsData>;

public sealed class BackfillAchievementsData
{
    public int MerchantsProcessed { get; set; }
    public int AchievementsAwarded { get; set; }
}
