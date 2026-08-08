using Microsoft.Extensions.Caching.Memory;
using System.Diagnostics;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;
using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.AkkadPag.Models;
using swiftpay_api_payment.Endpoints.Utils;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Interfaces.Acquirers;
using swiftpay_api_payment.Services.Acquirers.Utils;

namespace swiftpay_api_payment.Services.Acquirers;

public sealed class AkkadPagService(
    IAkkadPagClient akkadPagClient,
    ILogger<AkkadPagService> logger,
    IApiLogService apiLogService,
    IMemoryCache memoryCache
) : IAcquirerService
{
    public AcquirerType AcquirerType => AcquirerType.AkkadPag;

    public async Task<PixGenerationResult> GeneratePixAsync(AcquirerConfig config, PixGenerationRequest request)
    {
        var publicKey = config.GetCredential("publicKey");
        var secretKey = config.GetCredential("secretKey");
        var withdrawalKey = config.GetCredential("withdrawalKey");

        if (string.IsNullOrEmpty(publicKey) || string.IsNullOrEmpty(secretKey))
        {
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Credenciais AkkadPag nao configuradas."
            };
        }

        var expiresAt = DateTime.UtcNow.AddSeconds(request.ExpirationMinutes * 60);
        var txId = PixUtils.GenerateTxId();

        var customerName = string.IsNullOrWhiteSpace(request.CustomerName) ? "Cliente" : request.CustomerName.Trim();
        var customerEmail = string.IsNullOrWhiteSpace(request.CustomerEmail) ? "cliente@example.com" : request.CustomerEmail.Trim();
        var customerPhone = string.IsNullOrWhiteSpace(request.CustomerPhone) ? "00000000000" : new string(request.CustomerPhone.Where(char.IsDigit).ToArray());
        var customerDocument = string.IsNullOrWhiteSpace(request.CustomerDocument) ? "00000000000" : new string(request.CustomerDocument.Where(char.IsDigit).ToArray());
        var customerDocumentType = customerDocument.Length == 11 ? "CPF" : "CNPJ";

        var pixRequest = new AkkadPagPaymentRequest
        {
            Amount = request.Amount,
            PaymentMethod = "PIX",
            Items =
            [
                new AkkadPagItem
                {
                    Title = request.Description ?? "Pagamento PIX",
                    UnitPrice = request.Amount,
                    Quantity = 1,
                    Tangible = false,
                    ExternalRef = txId
                }
            ],
            Customer = new AkkadPagCustomer
            {
                Name = customerName,
                Email = customerEmail,
                Phone = customerPhone,
                Document = new AkkadPagDocument
                {
                    Number = customerDocument,
                    Type = customerDocumentType
                }
            },
            PostbackUrl = AcquirerWebhookUtils.BuildWebhookUrl(config.PlatformBaseUrl, AcquirerType.AkkadPag)
        };

        var stopwatch = Stopwatch.StartNew();
        var response = await akkadPagClient.CreatePaymentAsync(publicKey, secretKey, pixRequest);
        stopwatch.Stop();

        if (!response.Success || response.Data == null || string.IsNullOrEmpty(response.Data.Id) || response.Data.Pix == null)
        {
            await LogClientErrorAsync(config, "GeneratePix", $"{config.ApiBaseUrl}/transactions", "POST", ApiLogResourceType.Payment, response, pixRequest, stopwatch.ElapsedMilliseconds);
            logger.LogWarning("AkkadPag returned invalid PIX response: {Body}", response.ResponseBody);
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
            QrCode = response.Data.Pix.CopyPaste,
            CopyAndPaste = response.Data.Pix.CopyPaste,
            ExpiresAt = response.Data.Pix.ExpiresAt ?? expiresAt
        };
    }

    public async Task<PixStatusResult> GetPixStatusAsync(AcquirerConfig config, string txId)
    {
        var publicKey = config.GetCredential("publicKey");
        var secretKey = config.GetCredential("secretKey");

        if (string.IsNullOrEmpty(publicKey) || string.IsNullOrEmpty(secretKey))
        {
            return new PixStatusResult
            {
                Success = false,
                ErrorMessage = "Credenciais AkkadPag nao configuradas."
            };
        }

        var stopwatch = Stopwatch.StartNew();
        var response = await akkadPagClient.GetPaymentAsync(publicKey, secretKey, txId);
        stopwatch.Stop();

        var payment = response.Data?.Data;
        if (!response.Success || payment == null)
        {
            await LogClientErrorAsync(config, "GetPixStatus", $"{config.ApiBaseUrl}/transactions/{txId}", "GET", ApiLogResourceType.Payment, response, new { txId }, stopwatch.ElapsedMilliseconds);
            return new PixStatusResult
            {
                Success = false,
                ErrorMessage = "Falha ao consultar status do PIX."
            };
        }

        return new PixStatusResult
        {
            Success = true,
            Status = AkkadPagStatusConverter.ToPaymentStatus(payment.Status),
            EndToEndId = payment.Pix?.EndToEnd,
            CompletedAt = payment.PaidAt
        };
    }

    public async Task<WithdrawResult> WithdrawAsync(AcquirerConfig config, WithdrawRequest request)
    {
        var publicKey = config.GetCredential("publicKey");
        var secretKey = config.GetCredential("secretKey");
        var withdrawalKey = config.GetCredential("withdrawalKey");

        if (string.IsNullOrEmpty(publicKey) || string.IsNullOrEmpty(secretKey) || string.IsNullOrEmpty(withdrawalKey))
        {
            logger.LogWarning("AkkadPag withdrawal credentials missing for PayoutId={PayoutId}", request.PayoutId);
            return new WithdrawResult
            {
                Success = false,
                Status = WithdrawStatus.Failed,
                ErrorMessage = "Credenciais de saque AkkadPag nao configuradas."
            };
        }

        var pixKeyType = ResolvePixKeyType(request.PixKey);

        var transferRequest = new AkkadPagWithdrawalRequest
        {
            Amount = request.Amount,
            PixKey = request.PixKey,
            PixKeyType = pixKeyType,
            PostbackUrl = AcquirerWebhookUtils.BuildWebhookUrl(config.PlatformBaseUrl, AcquirerType.AkkadPag)
        };

        var stopwatch = Stopwatch.StartNew();
        var transferResponse = await akkadPagClient.CreateTransferAsync(publicKey, secretKey, withdrawalKey, transferRequest);
        stopwatch.Stop();

        if (!transferResponse.Success || transferResponse.Data == null)
        {
            await LogClientErrorAsync(config, "Withdraw", $"{config.ApiBaseUrl}/transfers", "POST", ApiLogResourceType.Payout, transferResponse, transferRequest, stopwatch.ElapsedMilliseconds);
            logger.LogWarning("Null response from AkkadPag withdraw: PayoutId={PayoutId}", request.PayoutId);
            return new WithdrawResult
            {
                Success = false,
                Status = WithdrawStatus.Failed,
                ErrorMessage = "Resposta nula da AkkadPag."
            };
        }

        var status = AkkadPagStatusConverter.ToWithdrawStatus(transferResponse.Data.Status);
        var success = status == WithdrawStatus.Completed;

        return new WithdrawResult
        {
            Success = success,
            Status = status,
            AcquirerTransactionId = transferResponse.Data.Id,
            AcquirerTxId = transferResponse.Data.Id,
            ErrorMessage = !success ? "Saque recusado pela AkkadPag." : null
        };
    }

    public async Task<bool> IsHealthyAsync(AcquirerConfig config)
    {
        try
        {
            var publicKey = config.GetCredential("publicKey");
            var secretKey = config.GetCredential("secretKey");
            if (string.IsNullOrEmpty(publicKey) || string.IsNullOrEmpty(secretKey))
            {
                return false;
            }

            var cacheKey = $"akkadpag:health:{config.AcquirerId}";
            if (memoryCache.TryGetValue(cacheKey, out bool cached))
            {
                return cached;
            }

            var companyResponse = await akkadPagClient.GetCompanyDetailsAsync(publicKey, secretKey);
            var healthy = companyResponse.Success && companyResponse.Data?.Data?.CompanyInfo?.Status == "APPROVED";

            memoryCache.Set(cacheKey, healthy, TimeSpan.FromSeconds(30));
            return healthy;
        }
        catch
        {
            return false;
        }
    }

    private static string ResolvePixKeyType(string pixKey)
    {
        if (string.IsNullOrWhiteSpace(pixKey))
            return "EVP";

        var digits = new string(pixKey.Where(char.IsDigit).ToArray());

        return digits.Length switch
        {
            11 => "CPF",
            14 => "CNPJ",
            _ when pixKey.Contains('@') => "EMAIL",
            _ when digits.Length is >= 10 and <= 11 => "PHONE",
            _ => "EVP"
        };
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
