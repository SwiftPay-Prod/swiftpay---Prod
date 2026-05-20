using safefy_api_core.Interfaces;
using System.Diagnostics;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;
using safefy_api_payment.Clients;
using safefy_api_payment.Clients.Accithus;
using safefy_api_payment.Clients.Accithus.Models.CreateTransaction;
using safefy_api_payment.Clients.Accithus.Models.Withdrawals;
using safefy_api_payment.Interfaces;
using safefy_api_payment.Interfaces.Acquirers;
using safefy_api_payment.Services.Acquirers.Utils;

namespace safefy_api_payment.Services.Acquirers;

public sealed class AccithusService(
    IAccithusClient accithusClient,
    IApiLogService apiLogService,
    ILogger<AccithusService> logger
) : IAcquirerService
{
    public AcquirerType AcquirerType => AcquirerType.Accithus;

    public async Task<PixGenerationResult> GeneratePixAsync(AcquirerConfig config, PixGenerationRequest request)
    {
        if (!HasCredentials(config))
        {
            logger.LogError("Accithus credentials are missing for AcquirerId={AcquirerId}", config.AcquirerId);
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Credenciais de adquirente nao configuradas."
            };
        }

        var authHeader = AccithusClient.BuildAuthHeader(
            config.GetRequiredCredential("publicKey"),
            config.GetRequiredCredential("secretKey"));

        var customerName = ResolveCustomerName(request.CustomerName);
        var customerEmail = ResolveEmail(request.CustomerEmail, request.ExternalId);
        var document = NormalizeDocument(request.CustomerDocument);

        var createRequest = new AccithusCreateTransactionRequest
        {
            Amount = request.Amount,
            PaymentMethod = "pix",
            Customer = new AccithusCustomer
            {
                Name = customerName,
                Document = document,
                Email = customerEmail
            },
            Pix = new AccithusPixConfig
            {
                ExpiresInMinutes = request.ExpirationMinutes
            },
            CallbackUrl = BuildWebhookUrl(config),
            Description = request.Description
        };

        var stopwatch = Stopwatch.StartNew();
        var response = await accithusClient.CreateTransactionAsync(config.ApiBaseUrl, authHeader, createRequest);
        stopwatch.Stop();

        if (!response.Success || response.Data == null)
        {
            await LogClientErrorAsync(
                config,
                "CreateTransaction",
                $"{config.ApiBaseUrl}/v1/transactions",
                "POST",
                ApiLogResourceType.Payment,
                response,
                createRequest,
                stopwatch.ElapsedMilliseconds);

            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = response.ErrorMessage ?? "Falha ao gerar PIX. Tente novamente."
            };
        }

        var data = response.Data;
        var txId = data.TxId ?? data.Id ?? Guid.CreateVersion7().ToString("N");

        DateTime? expiresAt = null;
        if (!string.IsNullOrWhiteSpace(data.ExpiresAt) && DateTime.TryParse(data.ExpiresAt, out var parsed))
            expiresAt = parsed.ToUniversalTime();

        expiresAt ??= DateTime.UtcNow.AddMinutes(request.ExpirationMinutes);

        return new PixGenerationResult
        {
            Success = true,
            AcquirerId = config.AcquirerId,
            AcquirerPaymentId = data.Id ?? txId,
            TxId = txId,
            QrCode = data.QrCodeUrl,
            CopyAndPaste = data.CopyPaste ?? data.QrCode,
            ExpiresAt = expiresAt
        };
    }

    public async Task<PixStatusResult> GetPixStatusAsync(AcquirerConfig config, string txId)
    {
        if (!HasCredentials(config))
        {
            return new PixStatusResult
            {
                Success = false,
                ErrorMessage = "Credenciais de adquirente nao configuradas."
            };
        }

        var authHeader = AccithusClient.BuildAuthHeader(
            config.GetRequiredCredential("publicKey"),
            config.GetRequiredCredential("secretKey"));

        var stopwatch = Stopwatch.StartNew();
        var response = await accithusClient.GetTransactionAsync(config.ApiBaseUrl, authHeader, txId);
        stopwatch.Stop();

        if (!response.Success || response.Data == null)
        {
            await LogClientErrorAsync(
                config,
                "GetTransaction",
                $"{config.ApiBaseUrl}/v1/transactions/{txId}",
                "GET",
                ApiLogResourceType.Payment,
                response,
                new { txId },
                stopwatch.ElapsedMilliseconds);

            return new PixStatusResult
            {
                Success = false,
                ErrorMessage = response.ErrorMessage ?? "Falha ao consultar status do PIX."
            };
        }

        var data = response.Data;
        var status = AccithusStatusConverter.ToPaymentStatus(data.Status);

        DateTime? completedAt = null;
        if (!string.IsNullOrWhiteSpace(data.PaidAt) && DateTime.TryParse(data.PaidAt, out var paidAt))
            completedAt = paidAt.ToUniversalTime();

        return new PixStatusResult
        {
            Success = true,
            Status = status,
            EndToEndId = data.EndToEndId,
            CompletedAt = completedAt
        };
    }

    public async Task<WithdrawResult> WithdrawAsync(AcquirerConfig config, WithdrawRequest request)
    {
        if (!HasCredentials(config))
        {
            logger.LogError("Accithus credentials are missing for withdrawal: PayoutId={PayoutId}", request.PayoutId);
            return new WithdrawResult
            {
                Success = false,
                Status = WithdrawStatus.Failed,
                ErrorMessage = "Credenciais de adquirente nao configuradas."
            };
        }

        var authHeader = AccithusClient.BuildAuthHeader(
            config.GetRequiredCredential("publicKey"),
            config.GetRequiredCredential("secretKey"));

        var pixKeyType = ResolvePixKeyType(request.PixKey, request.PixKeyType);

        var withdrawRequest = new AccithusWithdrawRequest
        {
            Amount = request.Amount,
            PixKey = request.PixKey,
            PixKeyType = pixKeyType,
            Description = $"Saque {request.PayoutId}",
            CallbackUrl = BuildWebhookUrl(config)
        };

        var stopwatch = Stopwatch.StartNew();
        var response = await accithusClient.WithdrawAsync(
            config.ApiBaseUrl,
            authHeader,
            withdrawRequest,
            request.PayoutId.ToString());
        stopwatch.Stop();

        if (!response.Success || response.Data == null || string.IsNullOrWhiteSpace(response.Data.Id))
        {
            await LogClientErrorAsync(
                config,
                "Withdraw",
                $"{config.ApiBaseUrl}/v1/withdrawals",
                "POST",
                ApiLogResourceType.Payout,
                response,
                withdrawRequest,
                stopwatch.ElapsedMilliseconds);

            return new WithdrawResult
            {
                Success = false,
                Status = WithdrawStatus.Failed,
                ErrorMessage = response.ErrorMessage ?? "Falha ao processar saque. Tente novamente."
            };
        }

        var status = AccithusStatusConverter.ToWithdrawStatus(response.Data.Status);

        return new WithdrawResult
        {
            Success = status != WithdrawStatus.Failed,
            Status = status,
            AcquirerTransactionId = response.Data.Id,
            AcquirerTxId = response.Data.TxId ?? response.Data.Id
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

    private static bool HasCredentials(AcquirerConfig config)
    {
        return config.HasCredential("publicKey") && config.HasCredential("secretKey");
    }

    private static string ResolveCustomerName(string? name)
    {
        return string.IsNullOrWhiteSpace(name) ? "Cliente" : name.Trim();
    }

    private static string ResolveEmail(string? email, string? externalId)
    {
        if (!string.IsNullOrWhiteSpace(email))
            return email.Trim();

        var suffix = string.IsNullOrWhiteSpace(externalId) ? Guid.CreateVersion7().ToString("N") : externalId;
        return $"cliente+{suffix}@safefy.com.br";
    }

    private static string NormalizeDocument(string? document)
    {
        if (string.IsNullOrWhiteSpace(document))
            return DocumentUtils.GenerateValidCpf();

        var digits = new string(document.Where(char.IsDigit).ToArray());
        return digits.Length == 0 ? DocumentUtils.GenerateValidCpf() : digits;
    }

    private static string ResolvePixKeyType(string pixKey, string? pixKeyType)
    {
        if (!string.IsNullOrWhiteSpace(pixKeyType))
        {
            return pixKeyType.Trim().ToLowerInvariant() switch
            {
                "cpf" => "cpf",
                "cnpj" => "cnpj",
                "email" or "e-mail" => "email",
                "phone" or "telefone" or "celular" => "phone",
                "evp" or "random" => "evp",
                _ => "evp"
            };
        }

        var cleanKey = new string(pixKey.Where(c => char.IsLetterOrDigit(c) || c == '@' || c == '.').ToArray());

        if (cleanKey.All(char.IsDigit) && cleanKey.Length == 11)
            return "cpf";

        if (cleanKey.All(char.IsDigit) && cleanKey.Length == 14)
            return "cnpj";

        if (pixKey.Contains('@'))
            return "email";

        if (pixKey.StartsWith("+55") || (cleanKey.All(char.IsDigit) && cleanKey.Length >= 10 && cleanKey.Length <= 13))
            return "phone";

        return "evp";
    }

    private static string? BuildWebhookUrl(AcquirerConfig config)
    {
        return AcquirerWebhookUtils.BuildWebhookUrl(config.PlatformBaseUrl, AcquirerType.Accithus);
    }
}
