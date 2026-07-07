using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Achievements.BackfillAchievements;

public sealed class BackfillAchievementsResponse : BaseResponse<BackfillAchievementsData>;

public sealed class BackfillAchievementsData
{
    public int MerchantsProcessed { get; set; }
    public int AchievementsAwarded { get; set; }
}
