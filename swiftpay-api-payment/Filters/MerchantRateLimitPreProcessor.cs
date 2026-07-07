using System.Security.Claims;
using FastEndpoints;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_payment.Interfaces.Internal;

namespace swiftpay_api_payment.Filters;

public class MerchantRateLimitPreProcessor(IWebHostEnvironment environment) : IGlobalPreProcessor
{
    public async Task PreProcessAsync(IPreProcessorContext ctx, CancellationToken ct)
    {
        if (environment.IsDevelopment())
            return;

        if (ctx.HttpContext.User.Identity?.IsAuthenticated != true)
            return;

        if (ctx.HttpContext.Request.Method != HttpMethods.Post)
            return;

        var merchantIdClaim = ctx.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(merchantIdClaim, out var merchantId))
            return;

        var rateLimitService = ctx.HttpContext.Resolve<IRateLimitService>();
        var result = await rateLimitService.CheckRateLimitAsync(merchantId, ct);

        ctx.HttpContext.Response.Headers["X-RateLimit-Limit-Minute"] = result.LimitPerMinute.ToString();
        ctx.HttpContext.Response.Headers["X-RateLimit-Limit-Hour"] = result.LimitPerHour.ToString();
        ctx.HttpContext.Response.Headers["X-RateLimit-Limit-Day"] = result.LimitPerDay.ToString();
        ctx.HttpContext.Response.Headers["X-RateLimit-Remaining-Minute"] = Math.Max(0, result.LimitPerMinute - result.CurrentMinuteCount).ToString();
        ctx.HttpContext.Response.Headers["X-RateLimit-Remaining-Hour"] = Math.Max(0, result.LimitPerHour - result.CurrentHourCount).ToString();
        ctx.HttpContext.Response.Headers["X-RateLimit-Remaining-Day"] = Math.Max(0, result.LimitPerDay - result.CurrentDayCount).ToString();

        if (!result.IsAllowed)
        {
            ctx.HttpContext.Response.Headers["Retry-After"] = result.RetryAfterSeconds.ToString();

            var errorMessage = result.ExceededLimit switch
            {
                "minute" => $"Limite de {result.LimitPerMinute} requisições por minuto excedido.",
                "hour" => $"Limite de {result.LimitPerHour} requisições por hora excedido.",
                "day" => $"Limite de {result.LimitPerDay} requisições por dia excedido.",
                _ => "Limite de requisições excedido."
            };

            await ctx.HttpContext.Response.SendAsync(new BaseResponse
            {
                Error = new ApiErrorResponse(errorMessage, "rate_limit_exceeded")
            }, StatusCodes.Status429TooManyRequests, cancellation: ct);
        }
    }
}
