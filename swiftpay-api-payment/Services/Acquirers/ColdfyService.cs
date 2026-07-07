using swiftpay_api_core.Interfaces;
using System.Diagnostics;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;
using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.Coldfy.Models.Payments;
using swiftpay_api_payment.Clients.Coldfy.Models.Withdrawals;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Interfaces.Acquirers;
using swiftpay_api_payment.Services.Acquirers.Utils;

namespace swiftpay_api_payment.Services.Acquirers;

public sealed class ColdfyService(
    IColdfyClient coldfyClient,
    IApiLogService apiLogService,
    ILogger<ColdfyService> logger
) : IAcquirerService
{
    public AcquirerType AcquirerType => AcquirerType.Coldfy;

    public async Task<PixGenerationResult> GeneratePixAsync(AcquirerConfig config, PixGenerationRequest request)
    {
        if (!HasCredentials(config))
        {
            logger.LogError("Coldfy credentials are missing for AcquirerId={AcquirerId}", config.AcquirerId);
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Credenciais de adquirente nao configuradas."
            };
        }

        var customerName = ResolveCustomerName(request.CustomerName);
        var customerEmail = ResolveEmail(request.CustomerEmail, request.ExternalId);
        var customerPhone = ResolvePhone(request.CustomerPhone);
        var document = NormalizeDocument(request.CustomerDocument);
        var documentType = ResolveDocumentType(document);

        var createRequest = new ColdfyCreatePaymentRequest
        {
            Customer = new ColdfyCustomer
            {
                Name = customerName,
                Email = customerEmail,
                Phone = customerPhone,
                Document = new ColdfyDocument
                {
                    Number = document,
                    Type = documentType
                }
            },
            PaymentMethod = ColdfyPaymentMethod.Pix,
            Amount = request.Amount,
            Items = BuildItems(request.Amount, request.Description),
            Pix = new ColdfyPixConfig
            {
                ExpiresInDays = ResolvePixExpirationDays(request.ExpirationMinutes)
            },
            PostbackUrl = BuildWebhookUrl(config, AcquirerType.Coldfy),
            Description = request.Description,
            Metadata = BuildMetadata(request.ExternalId)
        };

        var createPaymentStopwatch = Stopwatch.StartNew();
        var response = await coldfyClient.CreatePaymentAsync(
            config.ApiBaseUrl,
            config.GetRequiredCredential("secretKey"),
            config.GetRequiredCredential("companyId"),
            createRequest);
        createPaymentStopwatch.Stop();

        if (!response.Success || response.Data == null || response.Data.Pix == null)
        {
            await LogClientErrorAsync(
                config,
                "CreatePayment",
                $"{config.ApiBaseUrl}/transactions",
                "POST",
                ApiLogResourceType.Payment,
                response,
                createRequest,
                createPaymentStopwatch.ElapsedMilliseconds);

            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = response.ErrorMessage ?? "Falha ao gerar PIX. Tente novamente."
            };
        }

        var txId = response.Data.Id ?? Guid.CreateVersion7().ToString("N");
        var expiresAt = response.Data.Pix.ExpirationDate ?? DateTime.UtcNow.AddMinutes(request.ExpirationMinutes);

        var pix = response.Data.Pix;
        var copyAndPaste = pix.QrCode;

        return new PixGenerationResult
        {
            Success = true,
            AcquirerId = config.AcquirerId,
            AcquirerPaymentId = response.Data.Id ?? txId,
            TxId = response.Data.Id ?? txId,
            QrCode = null, // Coldfy does not return a QR code image, only the EMV string
            CopyAndPaste = copyAndPaste,
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

        var getTransactionStopwatch = Stopwatch.StartNew();
        var response = await coldfyClient.GetTransactionAsync(config.ApiBaseUrl, config.GetRequiredCredential("secretKey"), config.GetRequiredCredential("companyId"), txId);
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
                new { txId },
                getTransactionStopwatch.ElapsedMilliseconds);

            return new PixStatusResult
            {
                Success = false,
                ErrorMessage = response.ErrorMessage ?? "Falha ao consultar status do PIX."
            };
        }

        var status = ColdfyStatusConverter.ToPaymentStatus(response.Data.Status);

        return new PixStatusResult
        {
            Success = true,
            Status = status,
            EndToEndId = response.Data.Pix?.EndToEndId,
            PayerName = response.Data.Customer?.Name,
            PayerDocument = response.Data.Customer?.Document?.Number,
            CompletedAt = response.Data.PaidAt
        };
    }

    public async Task<WithdrawResult> WithdrawAsync(AcquirerConfig config, WithdrawRequest request)
    {
        if (!HasCredentials(config))
        {
            logger.LogError("Coldfy credentials are missing for withdrawal: PayoutId={PayoutId}", request.PayoutId);
            return new WithdrawResult
            {
                Success = false,
                Status = WithdrawStatus.Failed,
                ErrorMessage = "Credenciais de adquirente nao configuradas."
            };
        }

        var pixKeyType = ResolvePixKeyType(request.PixKey, request.PixKeyType);

        var withdrawRequest = new ColdfyCreateWithdrawalRequest
        {
            PixKeyType = pixKeyType,
            PixKey = request.PixKey,
            RequestedAmount = request.Amount,
            Description = $"Saque {request.PayoutId}",
            IsPix = true,
            PostbackUrl = BuildWebhookUrl(config, AcquirerType.Coldfy)
        };

        var createWithdrawalStopwatch = Stopwatch.StartNew();
        var response = await coldfyClient.CreateWithdrawalAsync(
            config.ApiBaseUrl,
            config.GetRequiredCredential("secretKey"),
            config.GetRequiredCredential("companyId"),
            request.PayoutId.ToString(),
            withdrawRequest);
        createWithdrawalStopwatch.Stop();

        if (!response.Success || response.Data?.Withdrawal == null || string.IsNullOrWhiteSpace(response.Data.Withdrawal.Id))
        {
            await LogClientErrorAsync(
                config,
                "CreateWithdrawal",
                $"{config.ApiBaseUrl}/withdrawals/cashout",
                "POST",
                ApiLogResourceType.Payout,
                response,
                withdrawRequest,
                createWithdrawalStopwatch.ElapsedMilliseconds);

            return new WithdrawResult
            {
                Success = false,
                Status = WithdrawStatus.Failed,
                ErrorMessage = response.ErrorMessage ?? "Falha ao processar saque. Tente novamente."
            };
        }

        var status = ColdfyStatusConverter.ToWithdrawStatus(response.Data.Withdrawal.Status);

        return new WithdrawResult
        {
            Success = status != WithdrawStatus.Failed,
            Status = status,
            AcquirerTransactionId = response.Data.Withdrawal.Id,
            AcquirerTxId = response.Data.Withdrawal.Id
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

    private static bool HasCredentials(AcquirerConfig config)
    {
        return config.HasCredential("secretKey") && config.HasCredential("companyId");
    }

    private static List<ColdfyItem> BuildItems(long amount, string? description)
    {
        return
        [
            new ColdfyItem
            {
                Title = string.IsNullOrWhiteSpace(description) ? "Pagamento" : description.Trim(),
                UnitPrice = amount,
                Quantity = 1
            }
        ];
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
        return $"cliente+{suffix}@swiftpay.com.br";
    }

    private static string ResolvePhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return "11999999999";

        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.Length > 11)
        {
            digits = digits[^11..];
        }

        return digits.Length < 10 ? "11999999999" : digits;
    }

    private static string NormalizeDocument(string? document)
    {
        if (string.IsNullOrWhiteSpace(document))
            return DocumentUtils.GenerateValidCpf();

        var digits = new string(document.Where(char.IsDigit).ToArray());
        return digits.Length == 0 ? DocumentUtils.GenerateValidCpf() : digits;
    }

    private static ColdfyDocumentType ResolveDocumentType(string document)
    {
        return document.Length == 14 ? ColdfyDocumentType.Cnpj : ColdfyDocumentType.Cpf;
    }

    private static int ResolvePixExpirationDays(int expirationMinutes)
    {
        var days = (int)Math.Ceiling(expirationMinutes / 1440m);
        return Math.Clamp(days, 1, 7);
    }

    private static ColdfyPixKeyType ResolvePixKeyType(string pixKey, string? pixKeyType)
    {
        if (!string.IsNullOrWhiteSpace(pixKeyType))
        {
            return pixKeyType.Trim().ToLowerInvariant() switch
            {
                "cpf" => ColdfyPixKeyType.Cpf,
                "cnpj" => ColdfyPixKeyType.Cnpj,
                "email" => ColdfyPixKeyType.Email,
                "e-mail" => ColdfyPixKeyType.Email,
                "phone" => ColdfyPixKeyType.Phone,
                "telefone" => ColdfyPixKeyType.Phone,
                "celular" => ColdfyPixKeyType.Phone,
                "evp" => ColdfyPixKeyType.Evp,
                _ => ColdfyPixKeyType.Evp
            };
        }

        var cleanKey = new string(pixKey.Where(c => char.IsLetterOrDigit(c) || c == '@' || c == '.').ToArray());

        if (cleanKey.All(char.IsDigit) && cleanKey.Length == 11)
            return ColdfyPixKeyType.Cpf;

        if (cleanKey.All(char.IsDigit) && cleanKey.Length == 14)
            return ColdfyPixKeyType.Cnpj;

        if (pixKey.Contains('@'))
            return ColdfyPixKeyType.Email;

        if (pixKey.StartsWith("+55") || (cleanKey.All(char.IsDigit) && cleanKey.Length >= 10 && cleanKey.Length <= 13))
            return ColdfyPixKeyType.Phone;

        return ColdfyPixKeyType.Evp;
    }

    private static Dictionary<string, string>? BuildMetadata(string? externalId)
    {
        if (string.IsNullOrWhiteSpace(externalId))
            return null;

        return new Dictionary<string, string>
        {
            { "externalId", externalId }
        };
    }

    private static string? BuildWebhookUrl(AcquirerConfig config, AcquirerType acquirerType)
    {
        return AcquirerWebhookUtils.BuildWebhookUrl(config.PlatformBaseUrl, acquirerType);
    }
}
