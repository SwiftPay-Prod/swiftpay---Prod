using safefy_api_core.Models.Enum;
using safefy_api_core.Services;

namespace safefy_api_payment.Middlewares;

public class CheckoutEnvironmentMiddleware
{
    private readonly RequestDelegate _next;
    private const string CheckoutBasePath = "/v1/checkouts";
    private const string SandboxSegment = "/sandbox";

    public CheckoutEnvironmentMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        // Somente processar rotas de checkout público
        if (!path.StartsWith(CheckoutBasePath, StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        // Verificar se é rota de sandbox: /v1/checkouts/sandbox/{shortId}/*
        var checkoutPath = path[CheckoutBasePath.Length..];
        var isSandbox = checkoutPath.StartsWith(SandboxSegment, StringComparison.OrdinalIgnoreCase);

        var environment = isSandbox ? ApiEnvironment.Sandbox : ApiEnvironment.Production;

        // Setar o ambiente no AsyncLocal para que o scope atual use esse valor
        // O HybridEnvironmentProvider verifica primeiro o AsyncLocal, depois o header
        using (HybridEnvironmentProvider.SetEnvironment(environment))
        {
            await _next(context);
        }
    }
}

public static class CheckoutEnvironmentMiddlewareExtensions
{
    public static IApplicationBuilder UseCheckoutEnvironment(this IApplicationBuilder app)
    {
        return app.UseMiddleware<CheckoutEnvironmentMiddleware>();
    }
}
