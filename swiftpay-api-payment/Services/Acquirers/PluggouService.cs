using swiftpay_api_core.Interfaces;
using System.Diagnostics;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;
using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.Pluggou.Models;
using swiftpay_api_payment.Clients.Pluggou.Models.Transactions;
using swiftpay_api_payment.Clients.Pluggou.Models.Withdrawals;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Interfaces.Acquirers;
using swiftpay_api_payment.Services.Acquirers.Utils;

namespace swiftpay_api_payment.Services.Acquirers;

public sealed class PluggouService(
    IPluggouClient pluggouClient,
    IApiLogService apiLogService,
    ILogger<PluggouService> logger
) : IAcquirerService
{
    public AcquirerType AcquirerType => AcquirerType.Pluggou;

    public async Task<PixGenerationResult> GeneratePixAsync(AcquirerConfig config, PixGenerationRequest request)
    {
        if (!HasCredentials(config))
        {
            logger.LogError("Pluggou credentials are missing for AcquirerId={AcquirerId}", config.AcquirerId);
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Credenciais de adquirente nao configuradas."
            };
        }

        var buyer = new PluggouTransactionBuyer
        {
            BuyerName = ResolveCustomerName(request.CustomerName),
            BuyerDocument = NormalizeDocument(request.CustomerDocument),
            BuyerPhone = ResolvePhone(request.CustomerPhone),
            BuyerEmail = ResolveEmail(request.CustomerEmail, request.ExternalId)
        };

        var createRequest = new PluggouCreateTransactionRequest
        {
            PaymentMethod = PluggouPaymentMethod.Pix,
            Amount = request.Amount,
            Buyer = buyer
        };

        var createTransactionStopwatch = Stopwatch.StartNew();
        var response = await pluggouClient.CreateTransactionAsync(
            config.ApiBaseUrl,
            config.GetRequiredCredential("publicKey"),
            config.GetRequiredCredential("secretKey"),
            createRequest);
        createTransactionStopwatch.Stop();

        if (!response.Success || response.Data?.Data == null)
        {
            await LogClientErrorAsync(
                config,
                "CreateTransaction",
                $"{config.ApiBaseUrl}/transactions",
                "POST",
                ApiLogResourceType.Payment,
                response,
                createRequest,
                createTransactionStopwatch.ElapsedMilliseconds);

            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = response.ErrorMessage ?? "Falha ao gerar PIX. Tente novamente."
            };
        }

        var data = response.Data.Data;
        if (data.Pix?.Emv == null)
        {
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Falha ao gerar PIX. Tente novamente."
            };
        }
        var txId = data.Id ?? Guid.CreateVersion7().ToString("N");

        return new PixGenerationResult
        {
            Success = true,
            AcquirerId = config.AcquirerId,
            AcquirerPaymentId = txId,
            TxId = txId,
            QrCode = null,
            CopyAndPaste = data.Pix.Emv,
            ExpiresAt = DateTime.UtcNow.AddMinutes(request.ExpirationMinutes)
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
        var response = await pluggouClient.GetTransactionAsync(
            config.ApiBaseUrl,
            config.GetRequiredCredential("publicKey"),
            config.GetRequiredCredential("secretKey"),
            txId);
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
        var status = PluggouStatusConverter.ToPaymentStatus(data.Status);

        return new PixStatusResult
        {
            Success = true,
            Status = status,
            EndToEndId = data.EndToEndId,
            CompletedAt = data.PaidAt
        };
    }

    public async Task<WithdrawResult> WithdrawAsync(AcquirerConfig config, WithdrawRequest request)
    {
        if (!HasCredentials(config))
        {
            logger.LogError("Pluggou credentials are missing for withdrawal: PayoutId={PayoutId}", request.PayoutId);
            return new WithdrawResult
            {
                Success = false,
                Status = WithdrawStatus.Failed,
                ErrorMessage = "Credenciais de adquirente nao configuradas."
            };
        }

        var pixKeyType = ResolvePixKeyType(request.PixKey, request.PixKeyType);

        var withdrawRequest = new PluggouCreateWithdrawalRequest
        {
            Amount = request.Amount,
            KeyType = pixKeyType,
            KeyValue = request.PixKey
        };

        var createWithdrawalStopwatch = Stopwatch.StartNew();
        var response = await pluggouClient.CreateWithdrawalAsync(
            config.ApiBaseUrl,
            config.GetRequiredCredential("publicKey"),
            config.GetRequiredCredential("secretKey"),
            withdrawRequest);
        createWithdrawalStopwatch.Stop();

        if (!response.Success || response.Data?.Data == null || string.IsNullOrWhiteSpace(response.Data.Data.Id))
        {
            await LogClientErrorAsync(
                config,
                "CreateWithdrawal",
                $"{config.ApiBaseUrl}/withdrawals",
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

        var status = PluggouStatusConverter.ToWithdrawStatus(response.Data.Data.Status);

        return new WithdrawResult
        {
            Success = status != WithdrawStatus.Failed,
            Status = status,
            AcquirerTransactionId = response.Data.Data.Id,
            AcquirerTxId = response.Data.Data.Id
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

    private static PluggouPixKeyType? ResolvePixKeyType(string pixKey, string? providedType)
    {
        if (!string.IsNullOrWhiteSpace(providedType))
        {
            return providedType.Trim().ToLowerInvariant() switch
            {
                "cpf" => PluggouPixKeyType.Cpf,
                "cnpj" => PluggouPixKeyType.Cnpj,
                "email" => PluggouPixKeyType.Email,
                "phone" => PluggouPixKeyType.Phone,
                "telefone" => PluggouPixKeyType.Phone,
                "celular" => PluggouPixKeyType.Phone,
                "random" => PluggouPixKeyType.Random,
                "evp" => PluggouPixKeyType.Random,
                _ => PluggouPixKeyType.Random
            };
        }

        var cleanKey = new string(pixKey.Where(c => char.IsLetterOrDigit(c) || c == '@' || c == '.').ToArray());

        if (cleanKey.All(char.IsDigit) && cleanKey.Length == 11)
            return PluggouPixKeyType.Cpf;

        if (cleanKey.All(char.IsDigit) && cleanKey.Length == 14)
            return PluggouPixKeyType.Cnpj;

        if (pixKey.Contains('@'))
            return PluggouPixKeyType.Email;

        if (pixKey.StartsWith("+55") || (cleanKey.All(char.IsDigit) && cleanKey.Length >= 10 && cleanKey.Length <= 13))
            return PluggouPixKeyType.Phone;

        return PluggouPixKeyType.Random;
    }
}
