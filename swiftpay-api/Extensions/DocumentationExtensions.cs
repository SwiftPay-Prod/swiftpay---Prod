using Scalar.AspNetCore;

namespace swiftpay_api.Extensions;

public static class DocumentationExtensions
{
    public static IServiceCollection AddDocumentation(this IServiceCollection services)
    {
        services.AddOpenApi();

        return services;
    }

    public static WebApplication UseDocumentation(this WebApplication app, IWebHostEnvironment environment)
    {
        app.MapOpenApi();

        if (environment.IsDevelopment())
        {
            app.MapScalarApiReference("docs", (options, httpContext) =>
            {
                options
                    .WithTitle("SwiftPay Api")
                    .WithTheme(ScalarTheme.BluePlanet)
                    .PreserveSchemaPropertyOrder();
            });
        }
        else if (environment.IsStaging())
        {
            app.MapScalarApiReference("docs", (options, httpContext) =>
            {
                options
                    .WithTitle("SwiftPay Api - Staging")
                    .WithTheme(ScalarTheme.Saturn)
                    .PreserveSchemaPropertyOrder();
            });
        }
        else
        {
            app.MapScalarApiReference("docs", (options, httpContext) =>
            {
                options
                    .WithTitle("SwiftPay Api")
                    .WithTheme(ScalarTheme.BluePlanet)
                    .PreserveSchemaPropertyOrder();
            });
        }

        return app;
    }
}
