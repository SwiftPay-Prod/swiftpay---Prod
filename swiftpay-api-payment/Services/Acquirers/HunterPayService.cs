using System.Diagnostics;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Utils;
using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.HunterPay.Models.Transactions;
using swiftpay_api_payment.Clients.HunterPay.Models.Withdrawals;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Interfaces.Acquirers;
using swiftpay_api_payment.Services.Acquirers.Utils;

namespace swiftpay_api_payment.Services.Acquirers;

public sealed class HunterPayService(
    IHunterPayClient hunterPayClient,
    IApiLogService apiLogService,
    ILogger<HunterPayService> logger
) : IAcquirerService
{
    private const string DefaultCustomerDocument = "52998224725";
    private const string DefaultCustomerPhone = "11999999999";
    private const string DefaultTransactionDescription = "Pagamento PIX";
    private const string DefaultWithdrawalDescription = "Saque PIX";

    public AcquirerType AcquirerType => AcquirerType.HunterPay;

    public async Task<PixGenerationResult> GeneratePixAsync(AcquirerConfig config, PixGenerationRequest request)
    {
        if (!HasCredentials(config))
        {
            logger.LogError("HunterPay credentials are missing for AcquirerId={AcquirerId}", config.AcquirerId);
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Credenciais de adquirente nao configuradas."
            };
        }

        var createRequest = new HunterPayCreateTransactionRequest
        {
            PaymentMethod = "PIX",
            Amount = request.Amount,
            Description = ResolveDescription(request.Description, request.ExternalId),
            PostbackUrl = BuildWebhookUrl(config),
            Metadata = BuildMetadata(request.ExternalId),
            Customer = new HunterPayTransactionCustomer
            {
                Name = ResolveCustomerName(request.CustomerName),
                Email = ResolveCustomerEmail(request.CustomerEmail, request.ExternalId),
                Phone = ResolveCustomerPhone(request.CustomerPhone),
                Document = new HunterPayTransactionDocument
                {
                    Type = ResolveDocumentType(request.CustomerDocument),
                    Number = ResolveCustomerDocument(request.CustomerDocument)
                }
            },
            Items =
            [
                new HunterPayTransactionItem
                {
                    Title = ResolveItemTitle(request.Description),
                    UnitPrice = request.Amount,
                    Quantity = 1,
                    ExternalRef = request.ExternalId
                }
            ],
            Pix = new HunterPayPixRequest
            {
                ExpiresInDays = ResolvePixExpirationDays(request.ExpirationMinutes)
            }
        };

        var stopwatch = Stopwatch.StartNew();
        var response = await hunterPayClient.CreateTransactionAsync(
            ResolveBaseUrl(config.ApiBaseUrl),
            config.GetRequiredCredential("apiKey"),
            config.GetCredential("companyId"),
            createRequest);
        stopwatch.Stop();

        if (!response.Success || response.Data == null || string.IsNullOrWhiteSpace(response.Data.Id))
        {
            await LogClientErrorAsync(
                config,
                "CreateTransaction",
                $"{ResolveBaseUrl(config.ApiBaseUrl)}/transactions",
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

        var copyAndPaste = response.Data.Pix?.ResolveCopyAndPaste();

        return new PixGenerationResult
        {
            Success = true,
            AcquirerId = config.AcquirerId,
            AcquirerPaymentId = response.Data.Id,
            TxId = response.Data.Id,
            QrCode = response.Data.Pix?.QrCode ?? copyAndPaste,
            CopyAndPaste = copyAndPaste,
            ExpiresAt = response.Data.Pix?.ExpirationDate ?? DateTime.UtcNow.AddDays(ResolvePixExpirationDays(request.ExpirationMinutes))
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
        var response = await hunterPayClient.GetTransactionAsync(
            ResolveBaseUrl(config.ApiBaseUrl),
            config.GetRequiredCredential("apiKey"),
            config.GetCredential("companyId"),
            txId);
        stopwatch.Stop();

        if (!response.Success || response.Data == null)
        {
            await LogClientErrorAsync(
                config,
                "GetTransaction",
                $"{ResolveBaseUrl(config.ApiBaseUrl)}/transactions/{txId}",
                "GET",
                ApiLogResourceType.Payment,
                response,
                new { transactionId = txId },
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
            Status = HunterPayStatusConverter.ToPaymentStatus(response.Data.Status),
            EndToEndId = response.Data.Pix?.ResolveEndToEndId(),
            PayerName = response.Data.Customer?.Name,
            PayerDocument = response.Data.Customer?.ResolvedDocumentNumber,
            CompletedAt = response.Data.PaidAt
        };
    }

    public async Task<WithdrawResult> WithdrawAsync(AcquirerConfig config, WithdrawRequest request)
    {
        if (!HasCredentials(config))
        {
            logger.LogError("HunterPay credentials are missing for withdrawal: PayoutId={PayoutId}", request.PayoutId);
            return new WithdrawResult
            {
                Success = false,
                Status = WithdrawStatus.Failed,
                ErrorMessage = "Credenciais de adquirente nao configuradas."
            };
        }

        var withdrawRequest = new HunterPayCreateWithdrawalRequest
        {
            PixKeyType = ResolvePixKeyType(request.PixKey, request.PixKeyType),
            PixKey = ResolvePixKeyValue(request.PixKey),
            RequestedAmount = request.Amount,
            Description = ResolveWithdrawalDescription(request.PayoutId),
            IsPix = true,
            PostbackUrl = BuildWebhookUrl(config)
        };

        var stopwatch = Stopwatch.StartNew();
        var response = await hunterPayClient.CreateWithdrawalAsync(
            ResolveBaseUrl(config.ApiBaseUrl),
            config.GetRequiredCredential("apiKey"),
            config.GetCredential("companyId"),
            request.PayoutId.ToString(),
            withdrawRequest);
        stopwatch.Stop();

        if (!response.Success || response.Data?.Withdrawal == null || string.IsNullOrWhiteSpace(response.Data.Withdrawal.Id))
        {
            await LogClientErrorAsync(
                config,
                "CreateWithdrawal",
                $"{ResolveBaseUrl(config.ApiBaseUrl)}/withdrawals/cashout",
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

        var status = HunterPayStatusConverter.ToWithdrawStatus(response.Data.Withdrawal.Status);

        return new WithdrawResult
        {
            Success = status != WithdrawStatus.Failed,
            Status = status,
            AcquirerTransactionId = response.Data.Withdrawal.Id,
            AcquirerTxId = response.Data.Withdrawal.Id,
            ErrorMessage = response.Data.Withdrawal.ErrorMessage
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

    private static string? BuildWebhookUrl(AcquirerConfig config)
    {
        return AcquirerWebhookUtils.BuildWebhookUrl(config.PlatformBaseUrl, AcquirerType.HunterPay);
    }

    private static string ResolveBaseUrl(string baseUrl)
    {
        if (string.IsNullOrWhiteSpace(baseUrl))
            return "https://api.huntersub.com.br/functions/v1";

        return baseUrl.Replace("api.hunterpayments.com.br", "api.huntersub.com.br", StringComparison.OrdinalIgnoreCase);
    }

    private static string ResolvePixKeyType(string pixKey, string? pixKeyType)
    {
        var normalizedType = pixKeyType?.Trim().ToLowerInvariant();
        if (normalizedType is "cpf" or "cnpj" or "email" or "phone" or "evp")
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

    private static int ResolvePixExpirationDays(int expirationMinutes)
    {
        if (expirationMinutes <= 0)
            return 1;

        var days = (int)Math.Ceiling(expirationMinutes / 1440d);
        return Math.Clamp(days, 1, 7);
    }

    private static string ResolveDescription(string? description, string? externalId)
    {
        if (!string.IsNullOrWhiteSpace(description))
        {
            var trimmed = description.Trim();
            return trimmed[..Math.Min(trimmed.Length, 500)];
        }

        var fallback = string.IsNullOrWhiteSpace(externalId)
            ? DefaultTransactionDescription
            : $"Pagamento {externalId.Trim()}";

        return fallback[..Math.Min(fallback.Length, 500)];
    }

    private static string ResolveItemTitle(string? description)
    {
        var value = string.IsNullOrWhiteSpace(description) ? DefaultTransactionDescription : description.Trim();
        return value[..Math.Min(value.Length, 100)];
    }

    private static string ResolveCustomerName(string? name)
    {
        var value = string.IsNullOrWhiteSpace(name) ? "Cliente SwiftPay" : name.Trim();
        return value[..Math.Min(value.Length, 100)];
    }

    private static string ResolveCustomerEmail(string? email, string? externalId)
    {
        if (!string.IsNullOrWhiteSpace(email))
            return email.Trim();

        var suffix = string.IsNullOrWhiteSpace(externalId)
            ? Guid.CreateVersion7().ToString("N")
            : SanitizeToken(externalId);

        return $"{suffix}@swiftpay.local";
    }

    private static string ResolveCustomerPhone(string? phone)
    {
        var digits = NormalizeDigits(phone);
        return digits.Length is 10 or 11 ? digits : DefaultCustomerPhone;
    }

    private static string ResolveCustomerDocument(string? document)
    {
        var digits = NormalizeDigits(document);
        return digits.Length is 11 or 14 ? digits : DefaultCustomerDocument;
    }

    private static string ResolveDocumentType(string? document)
    {
        var digits = NormalizeDigits(document);
        return digits.Length == 14 ? "CNPJ" : "CPF";
    }

    private static string ResolveWithdrawalDescription(Guid payoutId)
    {
        var value = $"{DefaultWithdrawalDescription} {payoutId}";
        return value[..Math.Min(value.Length, 255)];
    }

    private static IReadOnlyDictionary<string, object?>? BuildMetadata(string? externalId)
    {
        if (string.IsNullOrWhiteSpace(externalId))
            return null;

        return new Dictionary<string, object?>
        {
            ["externalId"] = externalId.Trim()
        };
    }

    private static string NormalizeDigits(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        return new string(value.Where(char.IsDigit).ToArray());
    }

    private static string SanitizeToken(string value)
    {
        var sanitized = new string(value.Where(char.IsLetterOrDigit).ToArray());
        return string.IsNullOrWhiteSpace(sanitized) ? Guid.CreateVersion7().ToString("N") : sanitized.ToLowerInvariant();
    }
}
