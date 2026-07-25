using Microsoft.Extensions.Caching.Memory;
using System.Diagnostics;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;
using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.MagicPay.Models;
using swiftpay_api_payment.Endpoints.Utils;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Interfaces.Acquirers;
using swiftpay_api_payment.Services.Acquirers.Utils;

namespace swiftpay_api_payment.Services.Acquirers;

public sealed class MagicPayService(
    IMagicPayClient magicPayClient,
    ILogger<MagicPayService> logger,
    IApiLogService apiLogService
) : IAcquirerService
{
    public AcquirerType AcquirerType => AcquirerType.MagicPay;

    public async Task<PixGenerationResult> GeneratePixAsync(AcquirerConfig config, PixGenerationRequest request)
    {
        var apiKey = config.GetCredential("apiKey");
        if (string.IsNullOrEmpty(apiKey))
        {
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "API Key nao configurada."
            };
        }

        var expiresAt = DateTime.UtcNow.AddSeconds(request.ExpirationMinutes * 60);
        var txId = PixUtils.GenerateTxId();

        var pixRequest = new MagicPayPaymentRequest
        {
            Amount = request.Amount,
            Method = MagicPayPaymentMethod.PIX,
            Description = request.Description,
            ExternalRef = txId,
            Payer = !string.IsNullOrEmpty(request.CustomerDocument) || !string.IsNullOrEmpty(request.CustomerName)
                ? new MagicPayPayer
                {
                    Name = request.CustomerName,
                    TaxId = request.CustomerDocument,
                    Email = request.CustomerEmail
                }
                : null,
            Pix = new MagicPayPixConfig
            {
                ExpiresIn = request.ExpirationMinutes * 60
            }
        };

        var stopwatch = Stopwatch.StartNew();
        var response = await magicPayClient.CreatePaymentAsync(config.ApiBaseUrl, apiKey, pixRequest);
        stopwatch.Stop();

        if (!response.Success || response.Data == null || string.IsNullOrEmpty(response.Data.Id))
        {
            await LogClientErrorAsync(config, "GeneratePix", $"{config.ApiBaseUrl}/payment", "POST", ApiLogResourceType.Payment, response, pixRequest, stopwatch.ElapsedMilliseconds);
            logger.LogError("MagicPay returned null or empty response for PIX creation");
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Falha ao gerar PIX. Tente novamente."
            };
        }

        var copyPaste = response.Data.Data?.Copypaste;
        if (string.IsNullOrEmpty(copyPaste))
        {
            await LogClientErrorAsync(config, "GeneratePix", $"{config.ApiBaseUrl}/payment", "POST", ApiLogResourceType.Payment, response, pixRequest, stopwatch.ElapsedMilliseconds);
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
            AcquirerPaymentId = response.Data.Id,
            TxId = txId,
            QrCode = response.Data.Data?.QrCode,
            CopyAndPaste = copyPaste,
            ExpiresAt = expiresAt
        };
    }

    public async Task<PixStatusResult> GetPixStatusAsync(AcquirerConfig config, string txId)
    {
        var apiKey = config.GetCredential("apiKey");
        if (string.IsNullOrEmpty(apiKey))
        {
            return new PixStatusResult
            {
                Success = false,
                ErrorMessage = "API Key nao configurada."
            };
        }

        var stopwatch = Stopwatch.StartNew();
        var response = await magicPayClient.GetPaymentAsync(config.ApiBaseUrl, apiKey, txId);
        stopwatch.Stop();

        if (!response.Success || response.Data == null)
        {
            await LogClientErrorAsync(config, "GetPixStatus", $"{config.ApiBaseUrl}/payment/{txId}", "GET", ApiLogResourceType.Payment, response, new { txId }, stopwatch.ElapsedMilliseconds);
            return new PixStatusResult
            {
                Success = false,
                ErrorMessage = "Falha ao consultar status do PIX."
            };
        }

        var paymentStatus = MagicPayStatusConverter.ToPaymentStatus(response.Data.Status);

        string? endToEndId = null;
        DateTime? completedAt = null;

        if (response.Data.Data != null)
        {
            endToEndId = response.Data.Data.E2e;
            completedAt = response.Data.PaidAt;
        }

        return new PixStatusResult
        {
            Success = true,
            Status = paymentStatus,
            EndToEndId = endToEndId,
            CompletedAt = completedAt
        };
    }

    public async Task<WithdrawResult> WithdrawAsync(AcquirerConfig config, WithdrawRequest request)
    {
        var apiKey = config.GetCredential("apiKey");
        if (string.IsNullOrEmpty(apiKey))
        {
            logger.LogError("Failed to get MagicPay API key for withdrawal: PayoutId={PayoutId}", request.PayoutId);
            return new WithdrawResult
            {
                Success = false,
                Status = WithdrawStatus.Failed,
                ErrorMessage = "Falha ao autenticar com a adquirente."
            };
        }

        var externalRef = $"PAYOUT{request.PayoutId:N}".ToUpperInvariant();
        if (externalRef.Length > 64) externalRef = externalRef[..64];

        var pixKeyType = ResolvePixKeyType(request.PixKey);

        var transferRequest = new MagicPayTransferRequest
        {
            Amount = request.Amount,
            ExternalRef = externalRef,
            NotificationUrl = AcquirerWebhookUtils.BuildWebhookUrl(config.PlatformBaseUrl, AcquirerType.MagicPay),
            Pix = new MagicPayTransferPix
            {
                PixKeyType = pixKeyType,
                PixKey = request.PixKey
            }
        };

        var stopwatch = Stopwatch.StartNew();
        var transferResponse = await magicPayClient.CreateTransferAsync(config.ApiBaseUrl, apiKey, transferRequest);
        stopwatch.Stop();

        if (!transferResponse.Success || transferResponse.Data == null)
        {
            await LogClientErrorAsync(config, "Withdraw", $"{config.ApiBaseUrl}/transfer", "POST", ApiLogResourceType.Payout, transferResponse, transferRequest, stopwatch.ElapsedMilliseconds);
            logger.LogError("Null response from MagicPay withdraw: PayoutId={PayoutId}", request.PayoutId);
            return new WithdrawResult
            {
                Success = false,
                Status = WithdrawStatus.Failed,
                ErrorMessage = "Resposta nula da adquirente."
            };
        }

        var status = MagicPayStatusConverter.ToWithdrawStatus(transferResponse.Data.Status);
        var success = status != WithdrawStatus.Failed;

        return new WithdrawResult
        {
            Success = success,
            Status = status,
            AcquirerTransactionId = transferResponse.Data.Id,
            AcquirerTxId = externalRef,
            ErrorMessage = !success ? "Transferencia recusada pela MagicPay." : null
        };
    }

    private static string ResolvePixKeyType(string pixKey)
    {
        if (string.IsNullOrWhiteSpace(pixKey))
            return "EVP";

        var digits = new string(pixKey.Where(char.IsDigit).ToArray());

        if (digits.Length == 11)
            return "CPF";
        if (digits.Length == 14)
            return "CNPJ";
        if (pixKey.Contains('@'))
            return "EMAIL";
        if (digits.Length >= 10 && digits.Length <= 11)
            return "PHONE";

        return "EVP";
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
