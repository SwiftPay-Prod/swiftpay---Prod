using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using swiftpay_api_core.Database;
using swiftpay_api_payment.Interfaces.Internal;

namespace swiftpay_api_payment.Services.Internal;

public class RateLimitService(
    PrimaryDbContext dbContext,
    IMemoryCache cache
) : IRateLimitService
{
    private static readonly ConcurrentDictionary<string, AtomicCounter> _counters = new();
    private static readonly TimeSpan _settingsCacheDuration = TimeSpan.FromMinutes(5);
    private static DateTime _lastCleanup = DateTime.UtcNow;
    private static readonly object _cleanupLock = new();

    private const int AuthTokensPerHourLimit = 10;

    public AuthRateLimitResult CheckAuthRateLimit(Guid credentialId)
    {
        TryCleanupExpiredCounters();

        var now = DateTime.UtcNow;
        var hourKey = $"auth:{credentialId}:hour:{now:yyyyMMddHH}";
        var counter = GetOrCreateCounter(hourKey, TimeSpan.FromHours(2));
        var current = counter.IncrementAndGet();

        if (current > AuthTokensPerHourLimit)
        {
            return new AuthRateLimitResult
            {
                IsAllowed = false,
                CurrentCount = current,
                Limit = AuthTokensPerHourLimit,
                RetryAfterSeconds = (60 - now.Minute) * 60 + (60 - now.Second)
            };
        }

        return new AuthRateLimitResult
        {
            IsAllowed = true,
            CurrentCount = current,
            Limit = AuthTokensPerHourLimit,
            RetryAfterSeconds = 0
        };
    }

    public async Task<RateLimitResult> CheckRateLimitAsync(Guid merchantId, CancellationToken ct = default)
    {
        TryCleanupExpiredCounters();

        var limits = await GetMerchantLimitsAsync(merchantId, ct);
        var now = DateTime.UtcNow;

        var minuteKey = $"{merchantId}:minute:{now:yyyyMMddHHmm}";
        var hourKey = $"{merchantId}:hour:{now:yyyyMMddHH}";
        var dayKey = $"{merchantId}:day:{now:yyyyMMdd}";

        var minuteCounter = GetOrCreateCounter(minuteKey, TimeSpan.FromMinutes(2));
        var hourCounter = GetOrCreateCounter(hourKey, TimeSpan.FromHours(2));
        var dayCounter = GetOrCreateCounter(dayKey, TimeSpan.FromDays(2));

        var currentMinute = minuteCounter.IncrementAndGet();
        var currentHour = hourCounter.IncrementAndGet();
        var currentDay = dayCounter.IncrementAndGet();

        if (currentMinute > limits.PerMinute)
        {
            return new RateLimitResult
            {
                IsAllowed = false,
                CurrentMinuteCount = currentMinute,
                CurrentHourCount = currentHour,
                CurrentDayCount = currentDay,
                LimitPerMinute = limits.PerMinute,
                LimitPerHour = limits.PerHour,
                LimitPerDay = limits.PerDay,
                ExceededLimit = "minute",
                RetryAfterSeconds = 60 - now.Second
            };
        }

        if (currentHour > limits.PerHour)
        {
            return new RateLimitResult
            {
                IsAllowed = false,
                CurrentMinuteCount = currentMinute,
                CurrentHourCount = currentHour,
                CurrentDayCount = currentDay,
                LimitPerMinute = limits.PerMinute,
                LimitPerHour = limits.PerHour,
                LimitPerDay = limits.PerDay,
                ExceededLimit = "hour",
                RetryAfterSeconds = (60 - now.Minute) * 60
            };
        }

        if (currentDay > limits.PerDay)
        {
            return new RateLimitResult
            {
                IsAllowed = false,
                CurrentMinuteCount = currentMinute,
                CurrentHourCount = currentHour,
                CurrentDayCount = currentDay,
                LimitPerMinute = limits.PerMinute,
                LimitPerHour = limits.PerHour,
                LimitPerDay = limits.PerDay,
                ExceededLimit = "day",
                RetryAfterSeconds = (24 - now.Hour) * 3600
            };
        }

        return new RateLimitResult
        {
            IsAllowed = true,
            CurrentMinuteCount = currentMinute,
            CurrentHourCount = currentHour,
            CurrentDayCount = currentDay,
            LimitPerMinute = limits.PerMinute,
            LimitPerHour = limits.PerHour,
            LimitPerDay = limits.PerDay
        };
    }

    public async Task<MerchantRateLimits> GetMerchantLimitsAsync(Guid merchantId, CancellationToken ct = default)
    {
        var cacheKey = $"rate_limits:{merchantId}";

        if (cache.TryGetValue<MerchantRateLimits>(cacheKey, out var cachedLimits) && cachedLimits != null)
        {
            return cachedLimits;
        }

        var platformSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(ct);

        var defaultPerMinute = platformSettings?.RateLimitPerMinute ?? 60;
        var defaultPerHour = platformSettings?.RateLimitPerHour ?? 1000;
        var defaultPerDay = platformSettings?.RateLimitPerDay ?? 10000;

        var merchantSettings = await dbContext.MerchantSettings
            .AsNoTracking()
            .Where(ms => ms.MerchantId == merchantId)
            .OrderBy(ms => ms.Id)
            .FirstOrDefaultAsync(ct);

        var limits = new MerchantRateLimits
        {
            PerMinute = merchantSettings?.RateLimitPerMinute ?? defaultPerMinute,
            PerHour = merchantSettings?.RateLimitPerHour ?? defaultPerHour,
            PerDay = merchantSettings?.RateLimitPerDay ?? defaultPerDay
        };

        cache.Set(cacheKey, limits, _settingsCacheDuration);

        return limits;
    }

    private static AtomicCounter GetOrCreateCounter(string key, TimeSpan expiration)
    {
        return _counters.GetOrAdd(key, _ => new AtomicCounter(expiration));
    }

    private static void TryCleanupExpiredCounters()
    {
        var now = DateTime.UtcNow;
        if (now - _lastCleanup < TimeSpan.FromMinutes(5))
            return;

        lock (_cleanupLock)
        {
            if (now - _lastCleanup < TimeSpan.FromMinutes(5))
                return;

            _lastCleanup = now;

            var expiredKeys = _counters
                .Where(kvp => kvp.Value.IsExpired())
                .Select(kvp => kvp.Key)
                .ToList();

            foreach (var key in expiredKeys)
            {
                _counters.TryRemove(key, out _);
            }
        }
    }
}

internal sealed class AtomicCounter
{
    private int _count;
    private readonly DateTime _createdAt;
    private readonly TimeSpan _expiration;

    public AtomicCounter(TimeSpan expiration)
    {
        _count = 0;
        _createdAt = DateTime.UtcNow;
        _expiration = expiration;
    }

    public int IncrementAndGet() => Interlocked.Increment(ref _count);

    public int GetCount() => Volatile.Read(ref _count);

    public bool IsExpired() => DateTime.UtcNow - _createdAt > _expiration;
}
