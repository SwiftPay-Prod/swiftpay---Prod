using Microsoft.Extensions.Caching.Memory;
using System.Diagnostics;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_payment.Clients;
using safefy_api_payment.Clients.Bankizi.Models.CreatePix;
using safefy_api_payment.Clients.Bankizi.Models.Webhook;
using safefy_api_payment.Clients.Bankizi.Models.Withdrawals;
using safefy_api_core.Utils;
using safefy_api_payment.Endpoints.Utils;
using safefy_api_payment.Interfaces;
using safefy_api_payment.Interfaces.Acquirers;
using safefy_api_payment.Services.Acquirers.Utils;

namespace safefy_api_payment.Services.Acquirers;

public sealed class BankiziService(
    IBankiziClient bankiziClient,
    IMemoryCache memoryCache,
    IApiLogService apiLogService,
    ILogger<BankiziService> logger
) : IAcquirerService
{
    private static readonly SemaphoreSlim _tokenLock = new(1, 1);
    private const int TokenRefreshBufferSeconds = 300;
    private const string TokenCacheKeyPrefix = "bankizi_token_";

    public AcquirerType AcquirerType => AcquirerType.Bankizi;

    public async Task<PixGenerationResult> GeneratePixAsync(AcquirerConfig config, PixGenerationRequest request)
    {
        var accessToken = await EnsureTokenAsync(config);
        if (string.IsNullOrEmpty(accessToken))
        {
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Falha na autenticação."
            };
        }

        var expiresAt = DateTime.UtcNow.AddSeconds(request.ExpirationMinutes * 60);

        var txId = PixUtils.GenerateTxId();

        var pixRequest = new BankiziCreatePixRequest
        {
            Amount = request.Amount,
            Expiration = request.ExpirationMinutes * 60,
            TxId = txId,
            PayerInfo = !string.IsNullOrEmpty(request.CustomerDocument) || !string.IsNullOrEmpty(request.CustomerName)
                ? new BankiziPayerInfo
                {
                    Document = request.CustomerDocument,
                    Name = request.CustomerName
                }
                : null
        };

        var createPixStopwatch = Stopwatch.StartNew();
        var response = await bankiziClient.CreatePixAsync(config.ApiBaseUrl, accessToken, pixRequest);
        createPixStopwatch.Stop();
        if (!response.Success || response.Data == null || string.IsNullOrEmpty(response.Data.QrCode))
        {
            await LogClientErrorAsync(
                config,
                "CreatePix",
                $"{config.ApiBaseUrl}/pix/qrcode/dynamic",
                "POST",
                ApiLogResourceType.Payment,
            response,
            pixRequest,
            createPixStopwatch.ElapsedMilliseconds);
            logger.LogError("Bankizi returned null or empty response for PIX creation");
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
            AcquirerPaymentId = response.Data.TransactionId ?? response.Data.TxId ?? txId,
            TxId = response.Data.TxId ?? txId,
            QrCode = null,
            CopyAndPaste = response.Data.QrCode,
            ExpiresAt = expiresAt
        };
    }

    public async Task<PixStatusResult> GetPixStatusAsync(AcquirerConfig config, string txId)
    {
        var accessToken = await EnsureTokenAsync(config);
        if (string.IsNullOrEmpty(accessToken))
        {
            return new PixStatusResult
            {
                Success = false,
                ErrorMessage = "Falha na autenticação."
            };
        }

        var getPixStopwatch = Stopwatch.StartNew();
        var response = await bankiziClient.GetPixAsync(config.ApiBaseUrl, accessToken, txId);
        getPixStopwatch.Stop();
        if (!response.Success || response.Data == null)
        {
            await LogClientErrorAsync(
                config,
                "GetPix",
                $"{config.ApiBaseUrl}/pix/qrcode/{txId}",
                "GET",
                ApiLogResourceType.Payment,
            response,
            new { txId },
            getPixStopwatch.ElapsedMilliseconds);
            return new PixStatusResult
            {
                Success = false,
                ErrorMessage = "Falha ao consultar status do PIX."
            };
        }

        var paymentStatus = BankiziStatusConverter.ToPaymentStatus(response.Data.Status);

        string? endToEndId = null;
        string? payerName = null;
        string? payerDocument = null;
        DateTime? completedAt = null;

        if (response.Data.Pix?.Length > 0)
        {
            var pix = response.Data.Pix[0];
            endToEndId = pix.EndToEndId;
            completedAt = pix.Horario;

            if (pix.Pagador != null)
            {
                payerName = pix.Pagador.Nome;
                payerDocument = pix.Pagador.Cpf ?? pix.Pagador.Cnpj;
            }
        }

        return new PixStatusResult
        {
            Success = true,
            Status = paymentStatus,
            EndToEndId = endToEndId,
            PayerName = payerName,
            PayerDocument = payerDocument,
            CompletedAt = completedAt
        };
    }

    public async Task<WithdrawResult> WithdrawAsync(AcquirerConfig config, WithdrawRequest request)
    {
        var accessToken = await EnsureTokenAsync(config);
        if (string.IsNullOrEmpty(accessToken))
        {
            logger.LogError("Failed to get Bankizi token for withdrawal: PayoutId={PayoutId}", request.PayoutId);
            return new WithdrawResult
            {
                Success = false,
                Status = WithdrawStatus.Failed,
                ErrorMessage = "Falha ao autenticar com a adquirente."
            };
        }

        // TxId deve ter entre 25-36 caracteres, apenas letras maiúsculas e números
        var txId = $"PAYOUT{request.PayoutId:N}".ToUpperInvariant()[..36];
        var withdrawRequest = new BankiziWithdrawRequest
        {
            Amount = request.Amount,
            TxId = txId,
            PixKey = request.PixKey
        };

        var withdrawStopwatch = Stopwatch.StartNew();
        var withdrawResponse = await bankiziClient.WithdrawAsync(config.ApiBaseUrl, accessToken, withdrawRequest);
        withdrawStopwatch.Stop();

        if (!withdrawResponse.Success || withdrawResponse.Data == null)
        {
            await LogClientErrorAsync(
                config,
                "Withdraw",
                $"{config.ApiBaseUrl}/pix/withdraw/direct",
                "POST",
                ApiLogResourceType.Payout,
                withdrawResponse,
                withdrawRequest,
                withdrawStopwatch.ElapsedMilliseconds);
            logger.LogError("Null response from Bankizi withdraw: PayoutId={PayoutId}", request.PayoutId);
            return new WithdrawResult
            {
                Success = false,
                Status = WithdrawStatus.Failed,
                ErrorMessage = "Resposta nula da adquirente."
            };
        }

        var status = BankiziStatusConverter.ToWithdrawStatus(withdrawResponse.Data.Status);

        var success = status != WithdrawStatus.Failed;

        return new WithdrawResult
        {
            Success = success,
            Status = status,
            AcquirerTransactionId = withdrawResponse.Data.TransactionId,
            AcquirerTxId = withdrawResponse.Data.TxId,
            ErrorMessage = withdrawResponse.Data.ErrorMessage
        };
    }

    private async Task<string?> EnsureTokenAsync(AcquirerConfig config)
    {
        var clientId = config.GetCredential("clientId");
        var clientSecret = config.GetCredential("clientSecret");
        
        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
        {
            logger.LogError("Bankizi credentials are missing for AcquirerId={AcquirerId}", config.AcquirerId);
            return null;
        }
        
        var cacheKey = $"{TokenCacheKeyPrefix}{config.AcquirerId}:{clientId}";

        if (memoryCache.TryGetValue<string>(cacheKey, out var cachedToken))
            return cachedToken;

        await _tokenLock.WaitAsync();
        try
        {
            if (memoryCache.TryGetValue<string>(cacheKey, out cachedToken))
                return cachedToken;

            var tokenStopwatch = Stopwatch.StartNew();
            var tokenResponse = await bankiziClient.GetTokenAsync(config.ApiBaseUrl, clientId, clientSecret);
            tokenStopwatch.Stop();
            if (!tokenResponse.Success || tokenResponse.Data == null)
            {
                await LogClientErrorAsync(
                    config,
                    "GetToken",
                    $"{config.ApiBaseUrl}/auth/oauth/token",
                    "POST",
                    ApiLogResourceType.Token,
                    tokenResponse,
                    new { clientId },
                    tokenStopwatch.ElapsedMilliseconds);
                return null;
            }

            var cacheExpiration = TimeSpan.FromSeconds(tokenResponse.Data.ExpiresIn - TokenRefreshBufferSeconds);
            memoryCache.Set(cacheKey, tokenResponse.Data.AccessToken, cacheExpiration);

            return tokenResponse.Data.AccessToken;
        }
        finally
        {
            _tokenLock.Release();
        }
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
        {
            return Task.CompletedTask;
        }

        return apiLogService.LogAsync(new safefy_api_core.Models.Inputs.ApiLogInput
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
