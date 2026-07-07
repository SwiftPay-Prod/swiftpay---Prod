using swiftpay_api_payment.Documentation;
using Scalar.AspNetCore;

namespace swiftpay_api_payment.Extensions;

public static class DocumentationExtensions
{
    public static IServiceCollection AddDocumentation(this IServiceCollection services)
    {
        services.AddOpenApi(options =>
        {
            options.AddDocumentTransformer((document, context, cancellationToken) =>
            {
                document.Info = new()
                {
                    Title = "SwiftPay - Pix Gateway",
                    Version = "v1",
                    Description = EndpointDescriptions.ApiDescription,
                    Contact = new()
                    {
                        Name = "Suporte SwiftPay",
                        Email = "suporte@swiftpay.com.br"
                    }
                };

                return Task.CompletedTask;
            });
        });

        return services;
    }

    public static WebApplication UseDocumentation(this WebApplication app)
    {
        var scalarCssPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "css", "scalar-theme.css");
        var scalarCss = File.Exists(scalarCssPath) ? File.ReadAllText(scalarCssPath) : "";

        app.MapOpenApi();

        app.MapScalarApiReference("docs", options =>
        {
            options
                .WithTitle("SwiftPay API")
                .WithTheme(ScalarTheme.None)
                .EnableDarkMode()
                .PreserveSchemaPropertyOrder()
                .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient)
                .WithFavicon("https://console-production-ff4f.up.railway.app/api/v1/buckets/swiftpay-dev/objects/download?preview=true&prefix=public%2Flogo-swiftpay-100x100.png")
                .WithCustomCss(scalarCss)
                .HideModels()
                .HideClientButton()
                .HideTestRequestButton();
        });

        app.MapScalarApiReference("docs/classic", options =>
        {
            options
                .WithTitle("SwiftPay API")
                .WithTheme(ScalarTheme.None)
                .WithClassicLayout()
                .EnableDarkMode()
                .PreserveSchemaPropertyOrder()
                .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient)
                .WithFavicon("https://console-production-ff4f.up.railway.app/api/v1/buckets/swiftpay-dev/objects/download?preview=true&prefix=public%2Flogo-swiftpay-100x100.png")
                .WithCustomCss(scalarCss)
                .HideModels()
                .HideClientButton()
                .HideTestRequestButton();
        });

        return app;
    }
}
