using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Utils;

namespace swiftpay_api_core.Middlewares;

public class SecurityLogContextMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, ISecurityLogService securityLog)
    {
        var ipAddress = EndpointUtils.GetIpAddress(context);
        var userAgent = EndpointUtils.GetUserAgent(context);

        securityLog.SetContext(ipAddress, userAgent);

        await next(context);
    }
}

public static class SecurityLogContextMiddlewareExtensions
{
    public static IApplicationBuilder UseSecurityLogContext(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<SecurityLogContextMiddleware>();
    }
}
