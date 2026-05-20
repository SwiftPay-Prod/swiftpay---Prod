using safefy_api_core.Interfaces;
using System.Diagnostics;
using safefy_api_core.Models.Database;
using safefy_api_payment.Clients;
using safefy_api_payment.Clients.IHubBanking.Models.Transactions;
using safefy_api_payment.Clients.IHubBanking.Models.Withdrawals;
using safefy_api_core.Utils;
using safefy_api_payment.Endpoints.Utils;
using safefy_api_payment.Interfaces;
using safefy_api_payment.Interfaces.Acquirers;
using safefy_api_payment.Services.Acquirers.Utils;

namespace safefy_api_payment.Services.Acquirers;

public sealed class IHubBankingService(
    IIHubBankingClient ihubClient,
    IApiLogService apiLogService,
    ILogger<IHubBankingService> logger
) : IAcquirerService
{
    private const string WebhookPath = "/v1/internal/ihubbanking/webhooks";

    public AcquirerType AcquirerType => AcquirerType.IHubBanking;

    public async Task<PixGenerationResult> GeneratePixAsync(AcquirerConfig config, PixGenerationRequest request)
    {
        var secretKey = config.GetCredential("secretKey");
        
        if (string.IsNullOrEmpty(secretKey))
        {
            logger.LogError("IHub secret key is empty for AcquirerId={AcquirerId}", config.AcquirerId);
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Credenciais de adquirente não configuradas."
            };
        }

        var txId = PixUtils.GenerateTxId();

        var ihubRequest = new IHubCreateTransactionRequest
        {
            Name = request.CustomerName ?? "Cliente",
            Email = request.CustomerEmail ?? $"{txId}@securetransaction.com.br",
            Cpf = request.CustomerDocument ?? "00000000000",
            Phone = request.CustomerPhone ?? "00000000000",
            Amount = request.Amount,
            Description = request.Description ?? "Pagamento PIX",
            ResponsibleDocument = request.CustomerDocument ?? "00000000000",
            ResponsibleExternalId = txId,
            PaymentMethod = "PIX",
            Currency = "BRL",
            ExternalId = request.ExternalId ?? txId,
            PostbackUrl = BuildWebhookUrl(config)
        };

        var createTransactionStopwatch = Stopwatch.StartNew();
        var response = await ihubClient.CreateTransactionAsync(config.ApiBaseUrl, secretKey, ihubRequest);
        createTransactionStopwatch.Stop();
        
        if (!response.Success || response.Data == null)
        {
            await LogClientErrorAsync(
                config,
                "CreateTransaction",
                $"{config.ApiBaseUrl}/transactions/v2/purchase",
                "POST",
                ApiLogResourceType.Payment,
                response,
                ihubRequest,
                createTransactionStopwatch.ElapsedMilliseconds);
            logger.LogError("IHub returned null response for PIX creation");
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Falha ao gerar PIX. Tente novamente."
            };
        }

        if (!string.IsNullOrEmpty(response.Data.Error))
        {
            await LogClientErrorAsync(
                config,
                "CreateTransaction",
                $"{config.ApiBaseUrl}/transactions/v2/purchase",
                "POST",
                ApiLogResourceType.Payment,
                response,
                ihubRequest,
                createTransactionStopwatch.ElapsedMilliseconds);
            logger.LogError("IHub returned error for PIX creation: {Error}", response.Data.Error);
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = response.Data.Error
            };
        }

        if (string.IsNullOrEmpty(response.Data.PixCode))
        {
            logger.LogError("IHub returned empty PixCode for PIX creation");
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Falha ao gerar PIX. Tente novamente."
            };
        }

        var expiresAt = response.Data.ExpiresAt ?? DateTime.UtcNow.AddMinutes(request.ExpirationMinutes);

        return new PixGenerationResult
        {
            Success = true,
            AcquirerId = config.AcquirerId,
            AcquirerPaymentId = response.Data.TransactionId ?? txId,
            TxId = response.Data.TransactionId ?? txId,
            QrCode = response.Data.QrCode,
            CopyAndPaste = response.Data.PixCode,
            ExpiresAt = expiresAt
        };
    }

    public async Task<PixStatusResult> GetPixStatusAsync(AcquirerConfig config, string txId)
    {
        var secretKey = config.GetCredential("secretKey");
        
        if (string.IsNullOrEmpty(secretKey))
        {
            return new PixStatusResult
            {
                Success = false,
                ErrorMessage = "Credenciais de adquirente não configuradas."
            };
        }

        var getTransactionStopwatch = Stopwatch.StartNew();
        var response = await ihubClient.GetTransactionAsync(config.ApiBaseUrl, secretKey, txId, "externalId");
        
        if (!response.Success || response.Data == null)
        {
            response = await ihubClient.GetTransactionAsync(config.ApiBaseUrl, secretKey, txId, "id");
        }
        getTransactionStopwatch.Stop();

        if (!response.Success || response.Data == null)
        {
            await LogClientErrorAsync(
                config,
                "GetTransaction",
                $"{config.ApiBaseUrl}/transactions/{txId}",
                "GET",
                ApiLogResourceType.Payment,
                response,
                new { txId, queryType = "externalId|id" },
                getTransactionStopwatch.ElapsedMilliseconds);
            return new PixStatusResult
            {
                Success = false,
                ErrorMessage = "Transação não encontrada."
            };
        }

        var paymentStatus = IHubBankingStatusConverter.ToPaymentStatus(response.Data.Status);

        return new PixStatusResult
        {
            Success = true,
            Status = paymentStatus,
            EndToEndId = response.Data.EndToEndId,
            PayerName = response.Data.Payer?.Name,
            PayerDocument = response.Data.Payer?.Document,
            PayerBank = response.Data.Payer?.Bank,
            CompletedAt = response.Data.ApprovedAt
        };
    }

    public async Task<WithdrawResult> WithdrawAsync(AcquirerConfig config, WithdrawRequest request)
    {
        var secretKey = config.GetCredential("secretKey");
        
        if (string.IsNullOrEmpty(secretKey))
        {
            logger.LogError("IHub secret key is empty for withdrawal: PayoutId={PayoutId}", request.PayoutId);
            return new WithdrawResult
            {
                Success = false,
                Status = WithdrawStatus.Failed,
                ErrorMessage = "Credenciais de adquirente não configuradas."
            };
        }

        var pixType = DeterminePixKeyType(request.PixKey, request.PixKeyType);
        var externalId = $"PAYOUT{request.PayoutId:N}".ToUpperInvariant();

        var withdrawRequest = new IHubWithdrawRequest
        {
            Amount = request.Amount,
            PixKey = request.PixKey,
            PixType = pixType,
            ExternalId = externalId,
            PostbackUrl = BuildWebhookUrl(config)
        };

        var withdrawStopwatch = Stopwatch.StartNew();
        var withdrawResponse = await ihubClient.WithdrawAsync(config.ApiBaseUrl, secretKey, withdrawRequest);
        withdrawStopwatch.Stop();

        if (!withdrawResponse.Success || withdrawResponse.Data == null)
        {
            await LogClientErrorAsync(
                config,
                "Withdraw",
                $"{config.ApiBaseUrl}/withdraws/cash-out",
                "POST",
                ApiLogResourceType.Payout,
                withdrawResponse,
                withdrawRequest,
                withdrawStopwatch.ElapsedMilliseconds);
            logger.LogError("Null response from IHub withdraw: PayoutId={PayoutId}", request.PayoutId);
            return new WithdrawResult
            {
                Success = false,
                Status = WithdrawStatus.Failed,
                ErrorMessage = "Resposta nula da adquirente."
            };
        }

        var status = IHubBankingStatusConverter.ToWithdrawStatus(withdrawResponse.Data.Status);
        var success = status != WithdrawStatus.Failed;

        return new WithdrawResult
        {
            Success = success,
            Status = status,
            AcquirerTransactionId = withdrawResponse.Data.Id,
            AcquirerTxId = withdrawResponse.Data.Id,
            ErrorMessage = withdrawResponse.Data.Error
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
    private static string DeterminePixKeyType(string pixKey, string? pixKeyType)
    {
        if (!string.IsNullOrEmpty(pixKeyType))
        {
            return pixKeyType.ToUpperInvariant() switch
            {
                "CPF" => "CPF",
                "CNPJ" => "CNPJ",
                "EMAIL" or "E-MAIL" => "EMAIL",
                "PHONE" or "TELEFONE" or "CELULAR" => "PHONE",
                "EVP" or "ALEATORIA" or "RANDOM" => "RANDOM",
                _ => "RANDOM"
            };
        }

        if (string.IsNullOrEmpty(pixKey))
            return "RANDOM";

        var cleanKey = new string(pixKey.Where(c => char.IsLetterOrDigit(c) || c == '@' || c == '.').ToArray());

        if (cleanKey.All(char.IsDigit) && cleanKey.Length == 11)
            return "CPF";

        if (cleanKey.All(char.IsDigit) && cleanKey.Length == 14)
            return "CNPJ";

        if (pixKey.Contains('@'))
            return "EMAIL";

        if (pixKey.StartsWith("+55") || (cleanKey.All(char.IsDigit) && cleanKey.Length >= 10 && cleanKey.Length <= 13))
            return "PHONE";

        return "RANDOM";
    }

    private static string? BuildWebhookUrl(AcquirerConfig config)
    {
        if (string.IsNullOrEmpty(config.WebhookToken))
        {
            return null;
        }

        return WebhookUtils.BuildWebhookUrl(config.PlatformBaseUrl, WebhookPath, config.WebhookToken);
    }
}
