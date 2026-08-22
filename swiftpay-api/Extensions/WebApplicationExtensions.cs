using FastEndpoints;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Hubs;
using swiftpay_api.Middlewares;
using swiftpay_api_core.Extensions;
using swiftpay_api_core.Middlewares;

namespace swiftpay_api.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication UseSwiftPayPipeline(this WebApplication app, IWebHostEnvironment environment)
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

        app.UseMiddleware<SignalRQueryStringAuthenticationMiddleware>();

        app.UseAuthentication();
        app.UseSessionValidation();
        app.UseAuthorization();

        app.UseSecurityLogContext();
        app.UseApiLogContext();

        if (!environment.IsProduction())
        {
            app.UseMiniProfiler();
        }

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
