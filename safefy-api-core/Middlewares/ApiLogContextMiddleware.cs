using System.Security.Claims;
using System.Diagnostics;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Utils;

namespace safefy_api_core.Middlewares;

public class ApiLogContextMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, IApiLogService apiLogService, PrimaryDbContext primaryDbContext)
    {
        var stopwatch = Stopwatch.StartNew();
        var ipAddress = EndpointUtils.GetIpAddress(context);
        var userAgent = EndpointUtils.GetUserAgent(context);
        var location = ResolveLocation(context);

        var endpoint = context.Request.Path.Value ?? "/unknown";
        var httpMethod = context.Request.Method;

        apiLogService.SetEndpoint(httpMethod, endpoint);

        if (context.User.Identity?.IsAuthenticated == true)
        {
            var credentialIdClaim = context.User.FindFirst("credential_id")?.Value;

            if (!string.IsNullOrEmpty(credentialIdClaim))
            {
                var merchantIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (Guid.TryParse(merchantIdClaim, out var merchantId))
                {
                    Guid? credentialId = Guid.TryParse(credentialIdClaim, out var cid) ? cid : null;
                    var merchantInfo = await primaryDbContext.Merchants
                        .AsNoTracking()
                        .Where(m => m.Id == merchantId)
                        .Select(m => new
                        {
                            m.Name,
                            Document = m.MerchantKyc != null ? m.MerchantKyc.DocumentNumber : null
                        })
                        .FirstOrDefaultAsync(context.RequestAborted);

                    if (merchantInfo == null)
                    {
                        apiLogService.SetContext(merchantId, credentialId, ipAddress, userAgent, location);
                    }
                    else
                    {
                        apiLogService.SetContext(merchantId, merchantInfo.Name, merchantInfo.Document, credentialId, ipAddress, userAgent, location);
                    }
                }
            }
            else
            {
                apiLogService.SetContext(Guid.Empty, null, ipAddress, userAgent, location);
            }
        }

        try
        {
            await next(context);
        }
        finally
        {
            stopwatch.Stop();
            apiLogService.SetResponseTime(stopwatch.ElapsedMilliseconds);
            apiLogService.SetStatusCode(context.Response.StatusCode);
        }
    }

    private static string? ResolveLocation(HttpContext context)
    {
        var city = GetHeader(context, "CF-IPCity")
            ?? GetHeader(context, "X-Appengine-City")
            ?? GetHeader(context, "X-Geo-City")
            ?? GetHeader(context, "X-City");

        var region = GetHeader(context, "CF-IPRegion")
            ?? GetHeader(context, "X-Appengine-Region")
            ?? GetHeader(context, "X-Geo-Region")
            ?? GetHeader(context, "X-Region");

        var country = GetHeader(context, "CF-IPCountry")
            ?? GetHeader(context, "X-Country-Code")
            ?? GetHeader(context, "X-Vercel-IP-Country")
            ?? GetHeader(context, "X-Appengine-Country");

        var parts = new[] { city, region, country }
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (parts.Length == 0)
            return null;

        return string.Join(", ", parts);
    }

    private static string? GetHeader(HttpContext context, string name)
    {
        if (!context.Request.Headers.TryGetValue(name, out var value))
            return null;

        var normalized = value.ToString().Trim();
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }
}

public static class ApiLogContextMiddlewareExtensions
{
    public static IApplicationBuilder UseApiLogContext(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ApiLogContextMiddleware>();
    }
}
