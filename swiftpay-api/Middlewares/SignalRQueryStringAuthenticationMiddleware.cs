namespace swiftpay_api.Middlewares;

public sealed class SignalRQueryStringAuthenticationMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        PromoteAccessToken(context);
        await next(context);
    }

    public static void PromoteAccessToken(HttpContext context)
    {
        if (!context.Request.Path.StartsWithSegments("/hubs") ||
            context.Request.Headers.ContainsKey("Authorization") ||
            !context.Request.Query.TryGetValue("access_token", out var accessToken) ||
            string.IsNullOrWhiteSpace(accessToken))
        {
            return;
        }

        context.Request.Headers.Authorization = $"Bearer {accessToken}";
    }
}
