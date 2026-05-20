using safefy_api_core.Interfaces;
using System.Diagnostics;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;
using safefy_api_payment.Clients;
using safefy_api_payment.Clients.Rapdyn.Models.Payments;
using safefy_api_payment.Clients.Rapdyn.Models.Withdrawals;
using safefy_api_payment.Interfaces;
using safefy_api_payment.Interfaces.Acquirers;
using safefy_api_payment.Services.Acquirers.Utils;

namespace safefy_api_payment.Services.Acquirers;

public sealed class RapdynService(
    IRapdynClient rapdynClient,
    IApiLogService apiLogService,
    ILogger<RapdynService> logger
) : IAcquirerService
{
    public AcquirerType AcquirerType => AcquirerType.Rapdyn;

    public async Task<PixGenerationResult> GeneratePixAsync(AcquirerConfig config, PixGenerationRequest request)
    {
        var token = config.GetCredential("token");
        if (string.IsNullOrWhiteSpace(token))
        {
            logger.LogError("Rapdyn token is empty for AcquirerId={AcquirerId}", config.AcquirerId);
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Credenciais de adquirente nao configuradas."
            };
        }

        var externalId = request.ExternalId;
        var document = NormalizeDocument(request.CustomerDocument);
        var documentType = ResolveDocumentType(document);
        var email = ResolveEmail(request.CustomerEmail, externalId);
        var phone = ResolvePhone(request.CustomerPhone);

        var createRequest = new RapdynCreatePaymentRequest
        {
            Amount = request.Amount,
            Method = RapdynPaymentMethod.Pix,
            ExternalId = externalId,
            Customer = new RapdynPaymentCustomer
            {
                Name = ResolveCustomerName(request.CustomerName),
                Email = email,
                Phone = phone,
                Document = new RapdynPaymentDocument
                {
                    Type = documentType,
                    Value = FormatDocument(document, documentType)
                }
            },
            Delivery = BuildDelivery(config.AdditionalSettings),
            Products = BuildProducts(request.Amount, request.Description)
        };

        var createPaymentStopwatch = Stopwatch.StartNew();
        var response = await rapdynClient.CreatePaymentAsync(config.ApiBaseUrl, token, createRequest);
        createPaymentStopwatch.Stop();

        if (!response.Success || response.Data == null)
        {
            await LogClientErrorAsync(
                config,
                "CreatePayment",
                $"{config.ApiBaseUrl}/payments",
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

        var pix = response.Data.Pix;
        if (pix == null || string.IsNullOrEmpty(pix.CopyPaste))
        {
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Falha ao gerar PIX. Tente novamente."
            };
        }

        var txId = response.Data.Id ?? externalId ?? Guid.CreateVersion7().ToString("N");
        var expiresAt = DateTime.UtcNow.AddMinutes(request.ExpirationMinutes);

        return new PixGenerationResult
        {
            Success = true,
            AcquirerId = config.AcquirerId,
            AcquirerPaymentId = response.Data.Id ?? txId,
            TxId = response.Data.Id ?? txId,
            QrCode = pix.QrCode,
            CopyAndPaste = pix.CopyPaste,
            ExpiresAt = expiresAt
        };
    }

    public async Task<PixStatusResult> GetPixStatusAsync(AcquirerConfig config, string txId)
    {
        var token = config.GetCredential("token");
        if (string.IsNullOrWhiteSpace(token))
        {
            return new PixStatusResult
            {
                Success = false,
                ErrorMessage = "Credenciais de adquirente nao configuradas."
            };
        }

        var getTransactionStopwatch = Stopwatch.StartNew();
        var response = await rapdynClient.GetTransactionAsync(config.ApiBaseUrl, token, txId);
        getTransactionStopwatch.Stop();
        if (!response.Success || response.Data?.Data == null)
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

        var data = response.Data.Data;
        var status = RapdynStatusConverter.ToPaymentStatus(data.Status);

        return new PixStatusResult
        {
            Success = true,
            Status = status,
            EndToEndId = data.Pix?.EndToEndId,
            PayerName = data.Customer?.Name,
            PayerDocument = data.Customer?.Document?.Value,
            CompletedAt = data.CompletedAt
        };
    }

    public async Task<WithdrawResult> WithdrawAsync(AcquirerConfig config, WithdrawRequest request)
    {
        var token = config.GetCredential("token");
        if (string.IsNullOrWhiteSpace(token))
        {
            logger.LogError("Rapdyn token is empty for withdrawal: PayoutId={PayoutId}", request.PayoutId);
            return new WithdrawResult
            {
                Success = false,
                Status = WithdrawStatus.Failed,
                ErrorMessage = "Credenciais de adquirente nao configuradas."
            };
        }

        var pixKeyType = ResolvePixKeyType(request.PixKey, request.PixKeyType);
        var pixKey = FormatPixKey(request.PixKey, pixKeyType);

        var withdrawRequest = new RapdynCreateTransferRequest
        {
            PixKeyType = pixKeyType,
            PixKey = pixKey,
            Value = request.Amount
        };

        var createTransferStopwatch = Stopwatch.StartNew();
        var response = await rapdynClient.CreateTransferAsync(config.ApiBaseUrl, token, withdrawRequest);
        createTransferStopwatch.Stop();
        if (!response.Success || response.Data == null || string.IsNullOrEmpty(response.Data.TransferId))
        {
            await LogClientErrorAsync(
                config,
                "CreateTransfer",
                $"{config.ApiBaseUrl}/transfers/out",
                "POST",
                ApiLogResourceType.Payout,
                response,
                withdrawRequest,
                createTransferStopwatch.ElapsedMilliseconds,
                request.PayoutId);

            return new WithdrawResult
            {
                Success = false,
                Status = WithdrawStatus.Failed,
                ErrorMessage = response.ErrorMessage ?? "Falha ao processar saque. Tente novamente."
            };
        }

        var status = RapdynStatusConverter.ToWithdrawStatus(response.Data.Status);

        return new WithdrawResult
        {
            Success = status is WithdrawStatus.Completed or WithdrawStatus.Processing,
            Status = status,
            AcquirerTransactionId = response.Data.TransferId,
            AcquirerTxId = response.Data.TransferId
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
        long? responseTimeMs = null,
        Guid? resourceId = null)
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
            ResourceId = resourceId,
            ResourceType = resourceType,
            ResponseTimeMs = responseTimeMs
        });
    }

    private static RapdynPaymentDelivery BuildDelivery(Dictionary<string, string>? settings)
    {
        return new RapdynPaymentDelivery
        {
            Street = ResolveSetting(settings, "Rua N/A", "deliveryStreet", "delivery.street"),
            Number = ResolveSetting(settings, "0", "deliveryNumber", "delivery.number"),
            Neighborhood = ResolveSetting(settings, "Centro", "deliveryNeighborhood", "delivery.neighborhood"),
            City = ResolveSetting(settings, "Sao Paulo", "deliveryCity", "delivery.city"),
            State = ResolveSetting(settings, "SP", "deliveryState", "delivery.state"),
            Zipcode = ResolveSetting(settings, "01000-000", "deliveryZipcode", "delivery.zipcode", "deliveryPostalCode"),
            Complement = ResolveSetting(settings, string.Empty, "deliveryComplement", "delivery.complement")
        };
    }

    private static List<RapdynPaymentProduct> BuildProducts(long amount, string? description)
    {
        return
        [
            new RapdynPaymentProduct
            {
                Name = string.IsNullOrWhiteSpace(description) ? "Pagamento PIX" : description.Trim(),
                Price = amount,
                Quantity = "1",
                Type = RapdynProductType.Digital
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
        return $"cliente+{suffix}@safefy.com.br";
    }

    private static string ResolvePhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return "(11) 99999-9999";

        return FormatPhone(phone);
    }

    private static string NormalizeDocument(string? document)
    {
        if (string.IsNullOrWhiteSpace(document))
            return DocumentUtils.GenerateValidCpf();

        return new string(document.Where(char.IsDigit).ToArray());
    }

    private static RapdynDocumentType ResolveDocumentType(string document)
    {
        return document.Length == 14 ? RapdynDocumentType.Cnpj : RapdynDocumentType.Cpf;
    }

    private static string FormatDocument(string document, RapdynDocumentType type)
    {
        var digits = new string(document.Where(char.IsDigit).ToArray());

        if (type == RapdynDocumentType.Cnpj && digits.Length == 14)
            return $"{digits[..2]}.{digits[2..5]}.{digits[5..8]}/{digits[8..12]}-{digits[12..14]}";

        if (digits.Length == 11)
            return $"{digits[..3]}.{digits[3..6]}.{digits[6..9]}-{digits[9..11]}";

        return document;
    }

    private static RapdynPixKeyType ResolvePixKeyType(string pixKey, string? pixKeyType)
    {
        if (!string.IsNullOrWhiteSpace(pixKeyType))
        {
            return pixKeyType.Trim().ToLowerInvariant() switch
            {
                "cpf" => RapdynPixKeyType.Cpf,
                "cnpj" => RapdynPixKeyType.Cnpj,
                "email" => RapdynPixKeyType.Email,
                "e-mail" => RapdynPixKeyType.Email,
                "phone" => RapdynPixKeyType.Phone,
                "telefone" => RapdynPixKeyType.Phone,
                "celular" => RapdynPixKeyType.Phone,
                "random" => RapdynPixKeyType.RandomKey,
                "randomkey" => RapdynPixKeyType.RandomKey,
                "evp" => RapdynPixKeyType.RandomKey,
                _ => RapdynPixKeyType.RandomKey
            };
        }

        if (string.IsNullOrWhiteSpace(pixKey))
            return RapdynPixKeyType.RandomKey;

        var cleanKey = new string(pixKey.Where(c => char.IsLetterOrDigit(c) || c == '@' || c == '.').ToArray());

        if (cleanKey.All(char.IsDigit) && cleanKey.Length == 11)
            return RapdynPixKeyType.Cpf;

        if (cleanKey.All(char.IsDigit) && cleanKey.Length == 14)
            return RapdynPixKeyType.Cnpj;

        if (pixKey.Contains('@'))
            return RapdynPixKeyType.Email;

        if (pixKey.StartsWith("+55") || (cleanKey.All(char.IsDigit) && cleanKey.Length >= 10 && cleanKey.Length <= 13))
            return RapdynPixKeyType.Phone;

        return RapdynPixKeyType.RandomKey;
    }

    private static string FormatPixKey(string pixKey, RapdynPixKeyType pixKeyType)
    {
        if (string.IsNullOrWhiteSpace(pixKey))
            return pixKey;

        var digits = new string(pixKey.Where(char.IsDigit).ToArray());
        var phoneDigits = NormalizeBrazilPhoneDigits(digits);

        return pixKeyType switch
        {
            RapdynPixKeyType.Cpf when digits.Length == 11 => $"{digits[..3]}.{digits[3..6]}.{digits[6..9]}-{digits[9..11]}",
            RapdynPixKeyType.Cnpj when digits.Length == 14 => $"{digits[..2]}.{digits[2..5]}.{digits[5..8]}/{digits[8..12]}-{digits[12..14]}",
            RapdynPixKeyType.Phone when phoneDigits.Length == 10 => $"({phoneDigits[..2]}) {phoneDigits[2..6]}-{phoneDigits[6..10]}",
            RapdynPixKeyType.Phone when phoneDigits.Length == 11 => $"({phoneDigits[..2]}) {phoneDigits[2..7]}-{phoneDigits[7..11]}",
            _ => pixKey
        };
    }

    private static string FormatPhone(string phone)
    {
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        var phoneDigits = NormalizeBrazilPhoneDigits(digits);

        return phoneDigits.Length switch
        {
            10 => $"({phoneDigits[..2]}) {phoneDigits[2..6]}-{phoneDigits[6..10]}",
            11 => $"({phoneDigits[..2]}) {phoneDigits[2..7]}-{phoneDigits[7..11]}",
            _ => phone
        };
    }

    private static string NormalizeBrazilPhoneDigits(string digits)
    {
        if (digits.Length is 12 or 13 && digits.StartsWith("55", StringComparison.Ordinal))
            return digits[2..];

        return digits;
    }

    private static string ResolveSetting(Dictionary<string, string>? settings, string fallback, params string[] keys)
    {
        if (settings == null)
            return fallback;

        foreach (var key in keys)
        {
            if (settings.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value))
            {
                return value.Trim();
            }
        }

        return fallback;
    }
}
