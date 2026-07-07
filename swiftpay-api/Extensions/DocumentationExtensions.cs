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
        if (environment.IsDevelopment())
        {
            app.MapOpenApi();

            app.MapScalarApiReference("docs", (options, httpContext) =>
            {
                options
                    .WithTitle("Safefy Api")
                    .WithTheme(ScalarTheme.BluePlanet)
                    .PreserveSchemaPropertyOrder();
            });
        }

        if (environment.IsStaging())
        {
            app.MapOpenApi();

            app.MapScalarApiReference("docs", (options, httpContext) =>
            {
                options
                    .WithTitle("Safefy Api - Staging")
                    .WithTheme(ScalarTheme.Saturn)
                    .PreserveSchemaPropertyOrder();
            });
        }

        return app;
    }
}
