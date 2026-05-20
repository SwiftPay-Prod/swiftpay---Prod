using safefy_api_core.Interfaces;
using System.Diagnostics;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;
using safefy_api_payment.Clients;
using safefy_api_payment.Clients.ActivePayments.Models.CreateCharge;
using safefy_api_payment.Clients.ActivePayments.Models.Withdrawals;
using safefy_api_payment.Interfaces;
using safefy_api_payment.Interfaces.Acquirers;
using safefy_api_payment.Services.Acquirers.Utils;

namespace safefy_api_payment.Services.Acquirers;

public sealed class ActivePaymentsService(
    IActivePaymentsClient activePaymentsClient,
    IApiLogService apiLogService,
    ILogger<ActivePaymentsService> logger
) : IAcquirerService
{
    public AcquirerType AcquirerType => AcquirerType.ActivePayments;

    public async Task<PixGenerationResult> GeneratePixAsync(AcquirerConfig config, PixGenerationRequest request)
    {
        var publicKey = config.GetCredential("publicKey");
        var secretKey = config.GetCredential("secretKey");
        
        if (string.IsNullOrEmpty(publicKey) || string.IsNullOrEmpty(secretKey))
        {
            logger.LogError("ActivePayments credentials are missing for AcquirerId={AcquirerId}", config.AcquirerId);
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Credenciais de adquirente nao configuradas."
            };
        }

        if (string.IsNullOrWhiteSpace(request.CustomerName) || string.IsNullOrWhiteSpace(request.CustomerDocument))
        {
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Nome e CPF/CNPJ do cliente sao obrigatorios para gerar PIX."
            };
        }

        var cleanDocument = new string(request.CustomerDocument.Where(char.IsDigit).ToArray());
        var externalReference = request.ExternalId ?? Guid.CreateVersion7().ToString();
        var expiresAt = DateTime.UtcNow.AddMinutes(request.ExpirationMinutes);

        var createRequest = new ActivePaymentsCreateChargeRequest
        {
            Amount = request.Amount / 100m,
            CustomerName = request.CustomerName.Trim(),
            CustomerCpf = cleanDocument,
            CustomerEmail = request.CustomerEmail,
            CustomerPhone = request.CustomerPhone,
            ExpirationMinutes = request.ExpirationMinutes,
            ExternalReference = externalReference,
            AdditionalInfo = request.Description,
            PostbackUrl = BuildWebhookUrl(config)
        };

        var createChargeStopwatch = Stopwatch.StartNew();
        var response = await activePaymentsClient.CreateChargeAsync(
            config.ApiBaseUrl,
            publicKey,
            secretKey,
            createRequest);
        createChargeStopwatch.Stop();

        if (!response.Success || response.Data?.Pix == null || string.IsNullOrEmpty(response.Data.ChargeId))
        {
            await LogClientErrorAsync(
                config,
                "CreateCharge",
                $"{config.ApiBaseUrl}/charges",
                "POST",
                ApiLogResourceType.Payment,
                response,
                createRequest,
                createChargeStopwatch.ElapsedMilliseconds);

            logger.LogError("ActivePayments returned invalid response for PIX creation");
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Falha ao gerar PIX. Tente novamente."
            };
        }

        var qrCodeBase64 = response.Data.Pix.QrCodeBase64 ?? response.Data.Pix.QrCode;
        var txId = response.Data.ChargeId ?? response.Data.ExternalId ?? externalReference;

        return new PixGenerationResult
        {
            Success = true,
            AcquirerId = config.AcquirerId,
            AcquirerPaymentId = txId,
            TxId = txId,
            QrCode = qrCodeBase64,
            CopyAndPaste = response.Data.Pix.QrCode,
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
                ErrorMessage = "Credenciais de adquirente nao configuradas."
            };
        }

        var getChargeStopwatch = Stopwatch.StartNew();
        var response = await activePaymentsClient.GetChargeAsync(
            config.ApiBaseUrl,
            publicKey,
            secretKey,
            txId);
        getChargeStopwatch.Stop();

        if (!response.Success || response.Data == null)
        {
            await LogClientErrorAsync(
                config,
                "GetCharge",
                $"{config.ApiBaseUrl}/charges/{txId}",
                "GET",
                ApiLogResourceType.Payment,
                response,
                new { txId },
                getChargeStopwatch.ElapsedMilliseconds);

            return new PixStatusResult
            {
                Success = false,
                ErrorMessage = "Falha ao consultar status do PIX."
            };
        }

        var status = ActivePaymentsStatusConverter.ToPaymentStatus(response.Data.Status);

        return new PixStatusResult
        {
            Success = true,
            Status = status,
            EndToEndId = null,
            PayerName = response.Data.Customer?.Name,
            PayerDocument = response.Data.Customer?.Cpf,
            CompletedAt = response.Data.PaidAt
        };
    }

    public async Task<WithdrawResult> WithdrawAsync(AcquirerConfig config, WithdrawRequest request)
    {
        var publicKey = config.GetCredential("publicKey");
        var secretKey = config.GetCredential("secretKey");
        var withdrawalSecret = config.GetCredential("withdrawalSecret");

        if (string.IsNullOrEmpty(publicKey) || string.IsNullOrEmpty(secretKey))
        {
            logger.LogError("ActivePayments credentials are missing for AcquirerId={AcquirerId}", config.AcquirerId);
            return new WithdrawResult
            {
                Success = false,
                Status = WithdrawStatus.Failed,
                ErrorMessage = "Credenciais de adquirente nao configuradas."
            };
        }

        var pixKeyType = ResolvePixKeyType(request.PixKey, request.PixKeyType);
        var normalizedPixKey = NormalizeWithdrawPixKey(request.PixKey, pixKeyType);

        var withdrawRequest = new ActivePaymentsWithdrawRequest
        {
            Amount = request.Amount / 100m,
            PixKey = normalizedPixKey,
            PixKeyType = pixKeyType,
            ExternalReference = request.PayoutId.ToString(),
            PostbackUrl = BuildWebhookUrl(config)
        };

        var createWithdrawStopwatch = Stopwatch.StartNew();
        var response = await activePaymentsClient.CreateWithdrawAsync(
            config.ApiBaseUrl,
            publicKey,
            secretKey,
            withdrawRequest,
            withdrawalSecret);
        createWithdrawStopwatch.Stop();

        if (!response.Success || response.Data == null || string.IsNullOrEmpty(response.Data.WithdrawalId))
        {
            await LogClientErrorAsync(
                config,
                "CreateWithdraw",
                $"{config.ApiBaseUrl}/withdrawals",
                "POST",
                ApiLogResourceType.Payout,
                response,
                withdrawRequest,
                createWithdrawStopwatch.ElapsedMilliseconds);

            logger.LogError("ActivePayments returned invalid response for withdrawal");
            return new WithdrawResult
            {
                Success = false,
                Status = WithdrawStatus.Failed,
                ErrorMessage = "Falha ao processar saque. Tente novamente."
            };
        }

        var status = ActivePaymentsStatusConverter.ToWithdrawStatus(response.Data.Status);

        return new WithdrawResult
        {
            Success = true,
            Status = status,
            AcquirerTransactionId = response.Data.WithdrawalId,
            AcquirerTxId = response.Data.WithdrawalId
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

    private static ActivePaymentsPixKeyType ResolvePixKeyType(string pixKey, string? providedType)
    {
        if (!string.IsNullOrEmpty(providedType))
        {
            return providedType.Trim().ToLowerInvariant() switch
            {
                "cpf" => ActivePaymentsPixKeyType.Cpf,
                "cnpj" => ActivePaymentsPixKeyType.Cnpj,
                "email" => ActivePaymentsPixKeyType.Email,
                "phone" => ActivePaymentsPixKeyType.Phone,
                "evp" => ActivePaymentsPixKeyType.Evp,
                "random" => ActivePaymentsPixKeyType.Random,
                _ => ActivePaymentsPixKeyType.Random
            };
        }

        var cleanKey = new string(pixKey.Where(c => char.IsLetterOrDigit(c) || c == '@' || c == '.').ToArray());

        if (cleanKey.Length == 11 && cleanKey.All(char.IsDigit))
            return ActivePaymentsPixKeyType.Cpf;

        if (cleanKey.Length == 14 && cleanKey.All(char.IsDigit))
            return ActivePaymentsPixKeyType.Cnpj;

        if (cleanKey.Contains('@'))
            return ActivePaymentsPixKeyType.Email;

        if (pixKey.StartsWith("+55") || (cleanKey.All(char.IsDigit) && cleanKey.Length >= 10 && cleanKey.Length <= 13))
            return ActivePaymentsPixKeyType.Phone;

        return ActivePaymentsPixKeyType.Random;
    }

    private static string NormalizeWithdrawPixKey(string pixKey, ActivePaymentsPixKeyType pixKeyType)
    {
        if (pixKeyType != ActivePaymentsPixKeyType.Phone)
        {
            return pixKey;
        }

        var digitsOnly = new string(pixKey.Where(char.IsDigit).ToArray());

        if (digitsOnly.StartsWith("55", StringComparison.Ordinal) && digitsOnly.Length > 11)
        {
            digitsOnly = digitsOnly[2..];
        }

        return digitsOnly;
    }

    private static string? BuildWebhookUrl(AcquirerConfig config)
    {
        return AcquirerWebhookUtils.BuildWebhookUrl(config.PlatformBaseUrl, AcquirerType.ActivePayments);
    }
}
