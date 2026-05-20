using FastEndpoints;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using safefy_api.Endpoints.Models;
using safefy_api.Hubs;
using safefy_api.Middlewares;
using safefy_api_core.Extensions;
using safefy_api_core.Middlewares;

namespace safefy_api.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication UseSafefyPipeline(this WebApplication app, IWebHostEnvironment environment)
    {
        if (environment.IsStaging())
        {
            app.UseStagingDocsAuth();
        }

        if (!environment.IsDevelopment())
        {
            app.UseHttpsRedirection();
            app.UseRateLimiter();
        }

        app.UseCors();

        app.UseCorrelationId();

        app.UseAuthentication();
        app.UseSessionValidation();
        app.UseAuthorization();

        app.UseSecurityLogContext();
        app.UseApiLogContext();

        app.UseMiniProfiler();

        app.UseFastEndpoints(config =>
        {
            config.Errors.ResponseBuilder = (failures, ctx, statusCode) =>
            {
                var firstError = failures.FirstOrDefault()?.ErrorMessage ?? "Erro de validação.";
                return new BaseResponse
                {
                    Error = new(firstError)
                };
            };
        });

        app.MapHealthChecks("/health/live", new HealthCheckOptions
        {
            Predicate = _ => false
        });

        app.MapHealthChecks("/health/ready");
        app.MapHealthChecks("/health");

        app.MapHub<MainHub>("/hubs/notifications");

        return app;
    }
}
