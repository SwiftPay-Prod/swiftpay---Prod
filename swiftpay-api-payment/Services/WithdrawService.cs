using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Interfaces.Internal;
using swiftpay_api_payment.Services.Acquirers.Utils;

namespace swiftpay_api_payment.Services;

public class WithdrawService(
    IAcquirerConfigService acquirerConfigService,
    IAcquirerServiceFactory acquirerServiceFactory,
    IApiLogService apiLogService,
    ILogger<WithdrawService> logger
) : IWithdrawService
{
    public async Task<WithdrawServiceResult> ProcessWithdrawAsync(
        Guid merchantId,
        Guid payoutId,
        Guid merchantAcquirerId,
        Guid acquirerId,
        long amount,
        string pixKey,
        string? pixKeyType,
        ApiEnvironment environment)
    {
        try
        {
            var acquirerConfig = await acquirerConfigService.GetAcquirerConfigByMerchantAcquirerIdAsync(
                merchantId,
                merchantAcquirerId,
                environment);

            if (acquirerConfig == null)
            {
                acquirerConfig = await acquirerConfigService.GetAcquirerConfigAsync(merchantId, acquirerId, environment);
            }

            var validationError = ValidateAcquirerConfigForWithdraw(acquirerConfig, amount);
            if (validationError != null)
            {
                await LogWithdrawFailureAsync(
                    merchantId,
                    payoutId,
                    acquirerId,
                    "ValidateAcquirerConfig",
                    validationError.ErrorMessage,
                    new { payoutId, acquirerId, amount, pixKey, pixKeyType, environment });
                return validationError;
            }

            var acquirerServiceResult = GetValidatedAcquirerService(acquirerConfig!.AcquirerType);
            if (acquirerServiceResult.Error != null)
            {
                await LogWithdrawFailureAsync(
                    merchantId,
                    payoutId,
                    acquirerId,
                    "GetAcquirerService",
                    acquirerServiceResult.Error.ErrorMessage,
                    new { payoutId, acquirerId, acquirerType = acquirerConfig.AcquirerType.ToString(), amount, pixKey, pixKeyType, environment });
                return acquirerServiceResult.Error;
            }

            if (acquirerConfig.Config.IsSimulated)
                return CreateSimulatedWithdrawResult(payoutId);

            return await ExecuteWithdrawAsync(
                acquirerServiceResult.Service!,
                acquirerConfig.Config,
                payoutId,
                amount,
                pixKey,
                pixKeyType);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing withdraw for payout {PayoutId}", payoutId);
            await LogWithdrawFailureAsync(
                merchantId,
                payoutId,
                acquirerId,
                "ProcessWithdraw",
                ex.Message,
                new { payoutId, acquirerId, amount, pixKey, pixKeyType, environment });
            return CreateFailedResult("Erro interno ao processar saque.");
        }
    }

    public async Task<WithdrawServiceResult> ProcessPlatformWithdrawAsync(
        Guid payoutItemId,
        Guid acquirerId,
        long amount,
        string pixKey,
        string? pixKeyType,
        ApiEnvironment environment)
    {
        try
        {
            var acquirerConfig = await acquirerConfigService.GetPlatformAcquirerConfigAsync(acquirerId, environment);

            var validationError = ValidateAcquirerConfigForWithdraw(acquirerConfig, amount);
            if (validationError != null)
                return validationError;

            var acquirerServiceResult = GetValidatedAcquirerService(acquirerConfig!.AcquirerType);
            if (acquirerServiceResult.Error != null)
                return acquirerServiceResult.Error;

            if (acquirerConfig.Config.IsSimulated)
                return CreateSimulatedWithdrawResult(payoutItemId);

            return await ExecuteWithdrawAsync(
                acquirerServiceResult.Service!,
                acquirerConfig.Config,
                payoutItemId,
                amount,
                pixKey,
                pixKeyType);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing platform withdraw for item {PayoutItemId}", payoutItemId);
            return CreateFailedResult("Erro interno ao processar saque da plataforma.");
        }
    }

    private static WithdrawServiceResult? ValidateAcquirerConfigForWithdraw(AcquirerConfigResult? config, long amount)
    {
        if (config == null)
            return CreateFailedResult("Adquirente não encontrada ou não configurada.");

        if (!config.SupportsWithdrawal)
            return CreateFailedResult("Adquirente não suporta saques.");

        if (amount < config.MinPayoutAmount)
            return CreateFailedResult("O valor informado é inválido.");

        if (config.MaxPayoutAmount > 0 && amount > config.MaxPayoutAmount)
            return CreateFailedResult("O valor informado é inválido.");

        return null;
    }

    private (IAcquirerService? Service, WithdrawServiceResult? Error) GetValidatedAcquirerService(AcquirerType acquirerType)
    {
        var service = acquirerServiceFactory.GetService(acquirerType);

        if (service == null)
            return (null, CreateFailedResult($"Adquirente {acquirerType} não suportada."));

        return (service, null);
    }

    private static async Task<WithdrawServiceResult> ExecuteWithdrawAsync(
        IAcquirerService acquirerService,
        AcquirerConfig config,
        Guid payoutId,
        long amount,
        string pixKey,
        string? pixKeyType)
    {
        var request = CreateWithdrawRequest(payoutId, amount, pixKey, pixKeyType);
        var result = await acquirerService.WithdrawAsync(config, request);

        return MapAcquirerResultToWithdrawResult(result);
    }

    private static WithdrawRequest CreateWithdrawRequest(Guid payoutId, long amount, string pixKey, string? pixKeyType)
    {
        return new WithdrawRequest
        {
            PayoutId = payoutId,
            Amount = amount,
            PixKey = pixKey,
            PixKeyType = pixKeyType
        };
    }

    private static WithdrawServiceResult MapAcquirerResultToWithdrawResult(WithdrawResult result)
    {
        return new WithdrawServiceResult
        {
            Success = result.Success,
            Status = result.Status,
            AcquirerTransactionId = result.AcquirerTransactionId,
            AcquirerTxId = result.AcquirerTxId,
            ErrorMessage = result.ErrorMessage
        };
    }

    private static WithdrawServiceResult CreateSimulatedWithdrawResult(Guid payoutId)
    {
        return new WithdrawServiceResult
        {
            Success = true,
            Status = WithdrawStatus.Completed,
            AcquirerTransactionId = $"sandbox-{payoutId}"
        };
    }

    private static WithdrawServiceResult CreateFailedResult(string errorMessage)
    {
        return new WithdrawServiceResult
        {
            Success = false,
            Status = WithdrawStatus.Failed,
            ErrorMessage = errorMessage
        };
    }

    private Task LogWithdrawFailureAsync(
        Guid merchantId,
        Guid payoutId,
        Guid acquirerId,
        string operation,
        string? errorMessage,
        object payload)
    {
        return apiLogService.LogAsync(new ApiLogInput
        {
            Action = ApiLogAction.AcquirerRequestFailed,
            Status = ApiLogStatus.Failed,
            MerchantId = merchantId,
            ResourceId = payoutId,
            ResourceType = ApiLogResourceType.Payout,
            AcquirerId = acquirerId,
            Details = $"{operation}: {errorMessage ?? "Erro ao processar saque."}",
            RequestBody = AcquirerApiLogUtils.BuildRequestBody(
                acquirerId,
                "Unknown",
                [],
                operation,
                payload)
        });
    }
}
