using Microsoft.Extensions.Caching.Memory;
using System.Diagnostics;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;
using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.FlevoPay.Models;
using swiftpay_api_payment.Endpoints.Utils;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Interfaces.Acquirers;
using swiftpay_api_payment.Services.Acquirers.Utils;

namespace swiftpay_api_payment.Services.Acquirers;

public sealed class FlevoPayService(
    IFlevoPayClient flevoPayClient,
    ILogger<FlevoPayService> logger,
    IApiLogService apiLogService,
    IMemoryCache memoryCache
) : IAcquirerService
{
    public AcquirerType AcquirerType => AcquirerType.FlevoPay;

    public async Task<PixGenerationResult> GeneratePixAsync(AcquirerConfig config, PixGenerationRequest request)
    {
        var apiKey = config.GetCredential("secretKey");
        if (string.IsNullOrEmpty(apiKey))
        {
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Credenciais FlevoPay nao configuradas."
            };
        }

        var txId = PixUtils.GenerateTxId();
        var reference = string.IsNullOrWhiteSpace(request.ExternalId) ? txId : request.ExternalId.Trim();

        var customerName = string.IsNullOrWhiteSpace(request.CustomerName) ? "Cliente" : request.CustomerName.Trim();
        var customerEmail = string.IsNullOrWhiteSpace(request.CustomerEmail) ? "cliente@example.com" : request.CustomerEmail.Trim();
        var customerPhone = string.IsNullOrWhiteSpace(request.CustomerPhone) ? "00000000000" : new string(request.CustomerPhone.Where(char.IsDigit).ToArray());
        var customerDocument = string.IsNullOrWhiteSpace(request.CustomerDocument) ? "00000000000" : new string(request.CustomerDocument.Where(char.IsDigit).ToArray());

        var pixRequest = new FlevoPayPaymentRequest
        {
            Amount = request.Amount,
            Description = request.Description ?? "Pagamento PIX",
            Reference = reference,
            Source = "api_externa",
            Customer = new FlevoPayCustomer
            {
                Name = customerName,
                Email = customerEmail,
                Phone = customerPhone,
                Document = customerDocument
            },
            PostbackUrl = AcquirerWebhookUtils.BuildWebhookUrl(config.PlatformBaseUrl, AcquirerType.FlevoPay)
        };

        var stopwatch = Stopwatch.StartNew();
        var response = await flevoPayClient.CreatePaymentAsync(apiKey, pixRequest);
        stopwatch.Stop();

        if (!response.Success || response.Data == null)
        {
            await LogClientErrorAsync(config, "GeneratePix", $"{config.ApiBaseUrl}/transaction", "POST", ApiLogResourceType.Payment, response, pixRequest, stopwatch.ElapsedMilliseconds);
            logger.LogWarning("FlevoPay returned invalid PIX response: {Body}", response.ResponseBody);
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Falha ao gerar PIX. Tente novamente."
            };
        }

        var paymentId = response.Data.TransactionId?.ToString() ?? response.Data.Id;
        if (string.IsNullOrEmpty(paymentId) || string.IsNullOrEmpty(response.Data.QrCode))
        {
            await LogClientErrorAsync(config, "GeneratePix", $"{config.ApiBaseUrl}/transaction", "POST", ApiLogResourceType.Payment, response, pixRequest, stopwatch.ElapsedMilliseconds);
            logger.LogWarning("FlevoPay returned PIX without transaction id or qr_code: {Body}", response.ResponseBody);
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Falha ao gerar PIX. Tente novamente."
            };
        }

        return new PixGenerationResult
        {
            Success = true,
            AcquirerId = config.AcquirerId,
            AcquirerPaymentId = paymentId,
            TxId = paymentId,
            QrCode = response.Data.QrCode,
            CopyAndPaste = response.Data.QrCode,
            ExpiresAt = ParseExpiresAt(response.Data.ExpiresAt)
        };
    }

    public async Task<PixStatusResult> GetPixStatusAsync(AcquirerConfig config, string txId)
    {
        var apiKey = config.GetCredential("secretKey");
        if (string.IsNullOrEmpty(apiKey))
        {
            return new PixStatusResult
            {
                Success = false,
                ErrorMessage = "Credenciais FlevoPay nao configuradas."
            };
        }

        var stopwatch = Stopwatch.StartNew();
        var response = await flevoPayClient.GetPaymentAsync(apiKey, txId);
        stopwatch.Stop();

        if (!response.Success || response.Data == null)
        {
            await LogClientErrorAsync(config, "GetPixStatus", $"{config.ApiBaseUrl}/query", "GET", ApiLogResourceType.Payment, response, new { TxId = txId }, stopwatch.ElapsedMilliseconds);
            return new PixStatusResult
            {
                Success = false,
                ErrorMessage = "Falha ao consultar status do PIX."
            };
        }

        return new PixStatusResult
        {
            Success = true,
            Status = FlevoPayStatusConverter.ToPaymentStatus(response.Data.Status)
        };
    }

    public async Task<WithdrawResult> WithdrawAsync(AcquirerConfig config, WithdrawRequest request)
    {
        logger.LogWarning("FlevoPay does not support withdrawals. PayoutId={PayoutId}", request.PayoutId);
        return new WithdrawResult
        {
            Success = false,
            Status = WithdrawStatus.Failed,
            ErrorMessage = "FlevoPay nao suporta saques."
        };
    }

    public async Task<bool> IsHealthyAsync(AcquirerConfig config)
    {
        try
        {
            var apiKey = config.GetCredential("secretKey");
            if (string.IsNullOrEmpty(apiKey))
            {
                return false;
            }

            var cacheKey = $"flevopay:health:{config.AcquirerId}";
            if (memoryCache.TryGetValue(cacheKey, out bool cached))
            {
                return cached;
            }

            var sellerResponse = await flevoPayClient.GetSellerAsync(apiKey);
            var healthy = sellerResponse.Success && sellerResponse.Data != null;

            memoryCache.Set(cacheKey, healthy, TimeSpan.FromSeconds(30));
            return healthy;
        }
        catch
        {
            return false;
        }
    }

    private static DateTime? ParseExpiresAt(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        if (DateTime.TryParse(value, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal, out var dt))
            return dt;

        return null;
    }

    private Task LogClientErrorAsync<T>(
        AcquirerConfig config,
        string operation,
        string endpoint,
        string httpMethod,
        ApiLogResourceType resourceType,
        AcquirerClientResponse<T> response,
        object? requestPayload = null,
        long? responseTimeMs = null)
    {
        if (!config.MerchantId.HasValue)
            return Task.CompletedTask;

        return apiLogService.LogAsync(new swiftpay_api_core.Models.Inputs.ApiLogInput
        {
            Action = ApiLogAction.AcquirerRequestFailed,
            Status = ApiLogStatus.Failed,
            MerchantId = config.MerchantId,
            HttpMethod = httpMethod,
            Endpoint = endpoint,
            StatusCode = response.StatusCode ?? 0,
            Details = $"{operation}: {response.ErrorMessage ?? "Erro ao processar requisicao."}",
            ErrorCode = response.ErrorCode,
            RequestBody = AcquirerApiLogUtils.BuildRequestBody(config, operation, requestPayload),
            ResponseBody = response.ResponseBody,
            AcquirerId = config.AcquirerId,
            AcquirerType = AcquirerType.ToString(),
            ResourceType = resourceType,
            ResponseTimeMs = responseTimeMs
        });
    }
}