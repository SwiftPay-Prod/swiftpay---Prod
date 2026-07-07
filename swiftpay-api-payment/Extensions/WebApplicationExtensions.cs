using FastEndpoints;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_payment.Hubs;
using swiftpay_api_payment.Middlewares;
using swiftpay_api_core.Middlewares;

namespace swiftpay_api_payment.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication UseSwiftPayPipeline(this WebApplication app)
    {
        app.UseStaticFiles();

        if (app.Environment.IsProduction())
        {
            app.UseHttpsRedirection();
        }

        app.Use((context, next) =>
        {
            if (HttpMethods.IsPost(context.Request.Method)
                && context.Request.Path.StartsWithSegments("/v1/internal", StringComparison.OrdinalIgnoreCase)
                && !context.Request.Body.CanSeek)
            {
                context.Request.EnableBuffering();
            }

            return next();
        });

        app.UseCors();

        app.UseCorrelationId();

        app.UseAuthentication();
        app.UseAuthorization();

        app.UseCredentialValidation();
        app.UseCheckoutEnvironment();
        app.UseApiLogContext();

        app.UseMiniProfiler();

        app.UseFastEndpoints(config =>
        {
            config.Errors.ResponseBuilder = (failures, ctx, statusCode) =>
            {
                var firstError = failures.FirstOrDefault()?.ErrorMessage ?? "Erro de validação.";
                return new BaseResponse
                {
                    Error = new(firstError, "validation_error")
                };
            };
        });

        app.MapHealthChecks("/health/live", new HealthCheckOptions
        {
            Predicate = _ => false
        });

        app.MapHealthChecks("/health/ready");
        app.MapHealthChecks("/health");

        app.MapHub<PaymentStatusHub>("/hubs/payment-status")
            .RequireCors(CorsExtensions.CheckoutCorsPolicy);

        return app;
    }
}
