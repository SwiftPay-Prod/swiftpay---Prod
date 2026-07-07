using System.Net.Http.Headers;
using System.Text;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Middlewares;

public class StagingDocsAuthMiddleware(RequestDelegate next)
{
    private static readonly string[] ProtectedPaths = ["/openapi", "/docs"];

    public async Task InvokeAsync(HttpContext context, PrimaryDbContext dbContext)
    {
        var path = context.Request.Path.Value?.ToLower() ?? "";

        // Check if the path is protected
        if (!ProtectedPaths.Any(p => path.StartsWith(p)))
        {
            await next(context);
            return;
        }

        // Check for Basic Auth header
        if (!context.Request.Headers.TryGetValue("Authorization", out var authHeader))
        {
            SetUnauthorizedResponse(context);
            return;
        }

        try
        {
            var authHeaderValue = AuthenticationHeaderValue.Parse(authHeader!);

            if (authHeaderValue.Scheme != "Basic")
            {
                SetUnauthorizedResponse(context);
                return;
            }

            var credentialBytes = Convert.FromBase64String(authHeaderValue.Parameter ?? "");
            var credentials = Encoding.UTF8.GetString(credentialBytes).Split(':', 2);

            if (credentials.Length != 2)
            {
                SetUnauthorizedResponse(context);
                return;
            }

            var email = credentials[0].ToLower().Trim();
            var password = credentials[1];

            // Validate against database
            var user = await dbContext.Users
                .Where(u => u.Email == email && u.Status == UserStatus.Active && (u.Role == UserRole.Admin || u.Role == UserRole.God))
                .OrderBy(u => u.Id)
                .FirstOrDefaultAsync();

            if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.Password))
            {
                SetUnauthorizedResponse(context);
                return;
            }

            // User authenticated successfully
            await next(context);
        }
        catch
        {
            SetUnauthorizedResponse(context);
        }
    }

    private static void SetUnauthorizedResponse(HttpContext context)
    {
        context.Response.Headers.WWWAuthenticate = "Basic realm=\"Safefy Staging Docs\", charset=\"UTF-8\"";
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
    }
}

public static class StagingDocsAuthMiddlewareExtensions
{
    public static IApplicationBuilder UseStagingDocsAuth(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<StagingDocsAuthMiddleware>();
    }
}
