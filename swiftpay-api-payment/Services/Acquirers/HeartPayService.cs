using System.Diagnostics;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Utils;
using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.HeartPay.Models.Charges;
using swiftpay_api_payment.Clients.HeartPay.Models.Payouts;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Interfaces.Acquirers;
using swiftpay_api_payment.Services.Acquirers.Utils;

namespace swiftpay_api_payment.Services.Acquirers;

public sealed class HeartPayService(
    IHeartPayClient heartPayClient,
    IApiLogService apiLogService,
    ILogger<HeartPayService> logger
) : IAcquirerService
{
    private const string DefaultCustomerPhone = "11999999999";
    private const string DefaultDescription = "Pagamento PIX";
    private const string CanonicalBaseUrl = "https://app.heartpag.com/api";
    private const string LegacyBaseHost = "https://api.heartpay.com.br";
    private static readonly string[] FallbackCustomerNames =
    [
        "Cliente Checkout",
        "Comprador Online",
        "Cliente Digital",
        "Pagador Web"
    ];
    private static readonly string[] FallbackEmailPrefixes =
    [
        "cliente",
        "comprador",
        "pagador",
        "checkout"
    ];

    public AcquirerType AcquirerType => AcquirerType.HeartPay;

    public async Task<PixGenerationResult> GeneratePixAsync(AcquirerConfig config, PixGenerationRequest request)
    {
        if (!HasCredentials(config))
        {
            logger.LogError("HeartPay credentials are missing for AcquirerId={AcquirerId}", config.AcquirerId);
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Credenciais de adquirente nao configuradas."
            };
        }

        var createRequest = new HeartPayCreateChargeRequest
        {
            Value = request.Amount,
            Comment = ResolveDescription(request.Description, request.ExternalId),
            CorrelationId = ResolveCorrelationId(request.ExternalId, "HPAY"),
            Identifier = request.ExternalId,
            ExpiresDate = ResolveExpirationDate(request.ExpirationMinutes),
            Customer = new HeartPayChargeCustomerRequest
            {
                Name = ResolveCustomerName(request.CustomerName, request.ExternalId),
                Email = ResolveCustomerEmail(request.CustomerEmail, request.ExternalId),
                Phone = ResolveCustomerPhone(request.CustomerPhone),
                TaxId = ResolveCustomerDocument(request.CustomerDocument)
            }
        };

        var stopwatch = Stopwatch.StartNew();
        var response = await heartPayClient.CreateChargeAsync(
            ResolveBaseUrl(config.ApiBaseUrl),
            config.GetRequiredCredential("apiKey"),
            createRequest);
        stopwatch.Stop();

        var paymentIdentifier = response.Data?.CorrelationId ?? response.Data?.Id;

        if (!response.Success || response.Data == null || string.IsNullOrWhiteSpace(paymentIdentifier))
        {
            await LogClientErrorAsync(
                config,
                "CreateCharge",
                $"{ResolveBaseUrl(config.ApiBaseUrl)}/v1/client/charges",
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

        return new PixGenerationResult
        {
            Success = true,
            AcquirerId = config.AcquirerId,
            AcquirerPaymentId = paymentIdentifier,
            TxId = response.Data.TxId ?? paymentIdentifier,
            QrCode = response.Data.QrCode,
            CopyAndPaste = response.Data.CopyAndPaste,
            ExpiresAt = response.Data.ExpiresAt ?? DateTime.UtcNow.AddHours(24)
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

        var stopwatch = Stopwatch.StartNew();
        var response = await heartPayClient.GetChargeAsync(
            ResolveBaseUrl(config.ApiBaseUrl),
            config.GetRequiredCredential("apiKey"),
            txId);
        stopwatch.Stop();

        if (!response.Success || response.Data == null)
        {
            await LogClientErrorAsync(
                config,
                "GetCharge",
                $"{ResolveBaseUrl(config.ApiBaseUrl)}/v1/client/charges/{txId}",
                "GET",
                ApiLogResourceType.Payment,
                response,
                new { chargeId = txId },
                stopwatch.ElapsedMilliseconds);

            return new PixStatusResult
            {
                Success = false,
                ErrorMessage = response.ErrorMessage ?? "Falha ao consultar status do PIX."
            };
        }

        return new PixStatusResult
        {
            Success = true,
            Status = HeartPayStatusConverter.ToPaymentStatus(response.Data.Status),
            EndToEndId = response.Data.EndToEndId,
            CompletedAt = response.Data.PaidAt
        };
    }

    public async Task<WithdrawResult> WithdrawAsync(AcquirerConfig config, WithdrawRequest request)
    {
        if (!HasCredentials(config))
        {
            logger.LogError("HeartPay credentials are missing for withdrawal: PayoutId={PayoutId}", request.PayoutId);
            return new WithdrawResult
            {
                Success = false,
                Status = WithdrawStatus.Failed,
                ErrorMessage = "Credenciais de adquirente nao configuradas."
            };
        }

        var withdrawRequest = new HeartPayCreatePayoutRequest
        {
            Value = request.Amount,
            PixKeyType = ResolvePixKeyType(request.PixKey, request.PixKeyType),
            PixKey = ResolvePixKeyValue(request.PixKey),
            Description = $"Saque {request.PayoutId}",
            CorrelationId = request.PayoutId.ToString("N")
        };

        var stopwatch = Stopwatch.StartNew();
        var response = await heartPayClient.CreatePayoutAsync(
            ResolveBaseUrl(config.ApiBaseUrl),
            config.GetRequiredCredential("apiKey"),
            withdrawRequest);
        stopwatch.Stop();

        var payoutIdentifier = response.Data?.ReferenceCode ?? response.Data?.CorrelationId ?? response.Data?.Id;

        if (!response.Success || response.Data == null || string.IsNullOrWhiteSpace(payoutIdentifier))
        {
            await LogClientErrorAsync(
                config,
                "CreatePayout",
                $"{ResolveBaseUrl(config.ApiBaseUrl)}/v1/client/payouts",
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

        var status = HeartPayStatusConverter.ToWithdrawStatus(response.Data.Status);

        return new WithdrawResult
        {
            Success = status != WithdrawStatus.Failed,
            Status = status,
            AcquirerTransactionId = payoutIdentifier,
            AcquirerTxId = payoutIdentifier,
            ErrorMessage = response.Data.ErrorMessage
        };
    }

    private Task LogClientErrorAsync<T>(
        AcquirerConfig config,
        string operation,
        string endpoint,
        string httpMethod,
        ApiLogResourceType resourceType,
        AcquirerClientResponse<T> response,
        object? requestPayload,
        long? responseTimeMs = null)
    {
        if (!config.MerchantId.HasValue)
            return Task.CompletedTask;

        return apiLogService.LogAsync(new ApiLogInput
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
        return config.HasCredential("apiKey");
    }

    private static string ResolveBaseUrl(string baseUrl)
    {
        var normalizedBaseUrl = string.IsNullOrWhiteSpace(baseUrl)
            ? CanonicalBaseUrl
            : baseUrl.TrimEnd('/');

        if (normalizedBaseUrl.Contains(LegacyBaseHost, StringComparison.OrdinalIgnoreCase))
            return CanonicalBaseUrl;

        if (normalizedBaseUrl.EndsWith("/v1/client", StringComparison.OrdinalIgnoreCase))
            return normalizedBaseUrl[..^"/v1/client".Length].TrimEnd('/');

        return normalizedBaseUrl;
    }

    private static string ResolveCustomerName(string? value, string? source)
    {
        if (!string.IsNullOrWhiteSpace(value))
            return value.Trim();

        var index = ResolveFallbackIndex(source, FallbackCustomerNames.Length);
        return FallbackCustomerNames[index];
    }

    private static string ResolveCustomerEmail(string? value, string? externalId)
    {
        if (!string.IsNullOrWhiteSpace(value))
            return value.Trim();

        var prefixIndex = ResolveFallbackIndex(externalId, FallbackEmailPrefixes.Length);
        var prefix = FallbackEmailPrefixes[prefixIndex];
        var suffix = ResolveEmailSuffix(externalId);

        return $"{prefix}+{suffix}@transactions.swiftpay.app";
    }

    private static int ResolveFallbackIndex(string? source, int size)
    {
        if (size <= 1)
            return 0;

        var hash = ComputeStablePositiveHash(ResolveFallbackSource(source));
        return hash % size;
    }

    private static string ResolveEmailSuffix(string? source)
    {
        var raw = string.IsNullOrWhiteSpace(source)
            ? Guid.CreateVersion7().ToString("N")
            : source.Trim().ToLowerInvariant();

        var sanitized = new string(raw.Where(char.IsLetterOrDigit).ToArray());
        if (string.IsNullOrWhiteSpace(sanitized))
            sanitized = Guid.CreateVersion7().ToString("N");

        return sanitized.Length <= 24 ? sanitized : sanitized[^24..];
    }

    private static string ResolveFallbackSource(string? source)
    {
        return string.IsNullOrWhiteSpace(source)
            ? Guid.CreateVersion7().ToString("N")
            : source.Trim();
    }

    private static int ComputeStablePositiveHash(string value)
    {
        unchecked
        {
            var hash = 17;
            foreach (var ch in value)
            {
                hash = (hash * 31) + ch;
            }

            return hash & int.MaxValue;
        }
    }

    private static string ResolveCustomerPhone(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return DefaultCustomerPhone;

        var digits = new string(value.Where(char.IsDigit).ToArray());
        if (digits.Length > 11)
            digits = digits[^11..];

        return digits.Length < 10 ? DefaultCustomerPhone : digits;
    }

    private static string ResolveCustomerDocument(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return DocumentUtils.GenerateValidCpf();

        var digits = new string(value.Where(char.IsDigit).ToArray());
        return string.IsNullOrWhiteSpace(digits) ? DocumentUtils.GenerateValidCpf() : digits;
    }

    private static string ResolveDescription(string? description, string? externalId)
    {
        if (!string.IsNullOrWhiteSpace(description))
            return description.Trim();

        return string.IsNullOrWhiteSpace(externalId)
            ? DefaultDescription
            : $"Pagamento {externalId.Trim()}";
    }

    private static string ResolveCorrelationId(string? value, string prefix)
    {
        if (!string.IsNullOrWhiteSpace(value) && value.Trim().Length >= 26)
            return value.Trim();

        return $"{prefix}_{Guid.CreateVersion7():N}";
    }

    private static DateTime? ResolveExpirationDate(int expirationMinutes)
    {
        return expirationMinutes > 0
            ? DateTime.UtcNow.AddMinutes(expirationMinutes)
            : null;
    }

    private static string ResolvePixKeyType(string pixKey, string? pixKeyType)
    {
        var normalizedType = pixKeyType?.Trim().ToLowerInvariant();
        if (normalizedType is "cpf" or "cnpj" or "email" or "phone" or "evp" or "random")
            return normalizedType;

        var normalizedKey = pixKey.Trim();
        var digits = NormalizeDigits(normalizedKey);

        if (Guid.TryParse(normalizedKey, out _))
            return "evp";

        if (normalizedKey.Contains('@'))
            return "email";

        if (normalizedKey.StartsWith('+') || digits.Length is >= 10 and <= 15)
            return "phone";

        if (digits.Length == 14)
            return "cnpj";

        return "cpf";
    }

    private static string ResolvePixKeyValue(string pixKey)
    {
        var normalizedKey = pixKey.Trim();
        var normalizedType = ResolvePixKeyType(normalizedKey, null);

        return normalizedType switch
        {
            "cpf" or "cnpj" or "phone" => NormalizeDigits(normalizedKey),
            _ => normalizedKey
        };
    }

    private static string NormalizeDigits(string value)
    {
        return new string(value.Where(char.IsDigit).ToArray());
    }
}
