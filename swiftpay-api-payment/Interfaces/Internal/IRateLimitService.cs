namespace safefy_api_payment.Interfaces.Internal;

public interface IRateLimitService
{
    Task<RateLimitResult> CheckRateLimitAsync(Guid merchantId, CancellationToken ct = default);
    Task<MerchantRateLimits> GetMerchantLimitsAsync(Guid merchantId, CancellationToken ct = default);

    AuthRateLimitResult CheckAuthRateLimit(Guid credentialId);
}

public class AuthRateLimitResult
{
    public bool IsAllowed { get; set; }
    public int CurrentCount { get; set; }
    public int Limit { get; set; }
    public int RetryAfterSeconds { get; set; }
}

public class RateLimitResult
{
    public bool IsAllowed { get; set; }
    public int CurrentMinuteCount { get; set; }
    public int CurrentHourCount { get; set; }
    public int CurrentDayCount { get; set; }
    public int LimitPerMinute { get; set; }
    public int LimitPerHour { get; set; }
    public int LimitPerDay { get; set; }
    public string? ExceededLimit { get; set; }
    public int RetryAfterSeconds { get; set; }
}

public class MerchantRateLimits
{
    public int PerMinute { get; set; } = 60;
    public int PerHour { get; set; } = 1000;
    public int PerDay { get; set; } = 10000;
}
