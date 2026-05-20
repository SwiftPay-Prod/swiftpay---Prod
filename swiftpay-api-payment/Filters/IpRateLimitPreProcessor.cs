using System.Collections.Concurrent;
using FastEndpoints;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Filters;

public class IpRateLimitPreProcessor(IWebHostEnvironment environment) : IGlobalPreProcessor
{
    private static readonly ConcurrentDictionary<string, IpRateLimitCounter> _counters = new();
    private const int PermitLimit = 5;
    private static DateTime _lastCleanup = DateTime.UtcNow;
    private static readonly object _cleanupLock = new();

    public async Task PreProcessAsync(IPreProcessorContext ctx, CancellationToken ct)
    {
        if (environment.IsDevelopment())
            return;

        TryCleanupExpiredCounters();

        var ipAddress = GetIpAddress(ctx.HttpContext);
        var now = DateTime.UtcNow;
        var key = $"{ipAddress}:{now:yyyyMMddHHmm}";

        var counter = _counters.GetOrAdd(key, _ => new IpRateLimitCounter());
        var currentCount = counter.IncrementAndGet();

        ctx.HttpContext.Response.Headers["X-RateLimit-Limit"] = PermitLimit.ToString();
        ctx.HttpContext.Response.Headers["X-RateLimit-Remaining"] = Math.Max(0, PermitLimit - currentCount).ToString();

        if (currentCount > PermitLimit)
        {
            var retryAfter = 60 - now.Second;
            ctx.HttpContext.Response.Headers["Retry-After"] = retryAfter.ToString();

            await ctx.HttpContext.Response.SendAsync(new BaseResponse
            {
                Error = new ApiErrorResponse(
                    $"Limite de {PermitLimit} requisições por minuto excedido. Tente novamente em {retryAfter} segundos.",
                    "rate_limit_exceeded")
            }, StatusCodes.Status429TooManyRequests, cancellation: ct);
        }
    }

    private static string GetIpAddress(HttpContext context)
    {
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',')[0].Trim();
        }

        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    private static void TryCleanupExpiredCounters()
    {
        var now = DateTime.UtcNow;
        if (now - _lastCleanup < TimeSpan.FromMinutes(2))
            return;

        lock (_cleanupLock)
        {
            if (now - _lastCleanup < TimeSpan.FromMinutes(2))
                return;

            _lastCleanup = now;

            var cutoff = now.AddMinutes(-2).ToString("yyyyMMddHHmm");
            var keysToRemove = _counters.Keys.Where(k =>
            {
                var keyMinute = k.Split(':').LastOrDefault() ?? "";
                return string.CompareOrdinal(keyMinute, cutoff) < 0;
            }).ToList();

            foreach (var key in keysToRemove)
            {
                _counters.TryRemove(key, out _);
            }
        }
    }
}

public class IpRateLimitCounter
{
    private int _count;

    public int IncrementAndGet()
    {
        return Interlocked.Increment(ref _count);
    }
}
