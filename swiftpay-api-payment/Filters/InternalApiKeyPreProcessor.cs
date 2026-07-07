using FastEndpoints;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_core.Constants;

namespace swiftpay_api_payment.Filters;

public class InternalApiKeyPreProcessor(IConfiguration configuration) : IGlobalPreProcessor
{
    private const string InternalApiKeyHeader = "X-Internal-Api-Key";

    public async Task PreProcessAsync(IPreProcessorContext ctx, CancellationToken ct)
    {
        var internalApiKey = configuration["PlatformSettings:InternalApiKey"];

        if (string.IsNullOrEmpty(internalApiKey))
        {
            await ctx.HttpContext.Response.SendAsync(new BaseResponse
            {
                Error = new ApiErrorResponse("Configuração de API interna ausente.", PaymentApiErrorCodes.InternalApiKeyMissing)
            }, StatusCodes.Status401Unauthorized, cancellation: ct);
            return;
        }

        if (!ctx.HttpContext.Request.Headers.TryGetValue(InternalApiKeyHeader, out var providedKey))
        {
            await ctx.HttpContext.Response.SendAsync(new BaseResponse
            {
                Error = new ApiErrorResponse("Header de autenticação interna ausente.", PaymentApiErrorCodes.InternalApiKeyMissing)
            }, StatusCodes.Status401Unauthorized, cancellation: ct);
            return;
        }

        if (!string.Equals(internalApiKey, providedKey.ToString(), StringComparison.Ordinal))
        {
            await ctx.HttpContext.Response.SendAsync(new BaseResponse
            {
                Error = new ApiErrorResponse("Chave de API interna inválida.", PaymentApiErrorCodes.InternalApiKeyInvalid)
            }, StatusCodes.Status401Unauthorized, cancellation: ct);
            return;
        }
    }
}
