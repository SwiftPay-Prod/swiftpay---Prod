using safefy_api_payment.Interfaces.Internal;

namespace safefy_api_payment.Tests.Fixtures;

internal sealed class NoOpRateLimitService : IRateLimitService
{
    public Task<RateLimitResult> CheckRateLimitAsync(Guid merchantId, CancellationToken ct = default)
        => Task.FromResult(new RateLimitResult
        {
            IsAllowed = true,
            CurrentMinuteCount = 1,
            CurrentHourCount = 1,
            CurrentDayCount = 1,
            LimitPerMinute = 60,
            LimitPerHour = 1000,
            LimitPerDay = 10000
        });

    public Task<MerchantRateLimits> GetMerchantLimitsAsync(Guid merchantId, CancellationToken ct = default)
        => Task.FromResult(new MerchantRateLimits
        {
            PerMinute = 60,
            PerHour = 1000,
            PerDay = 10000
        });

    public AuthRateLimitResult CheckAuthRateLimit(Guid credentialId)
        => new()
        {
            IsAllowed = true,
            CurrentCount = 1,
            Limit = 1000,
            RetryAfterSeconds = 0
        };
}
