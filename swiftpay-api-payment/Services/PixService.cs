using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Interfaces.Internal;

namespace swiftpay_api_payment.Services;

public class PixService(
    IAcquirerConfigService acquirerConfigService,
    IAcquirerServiceFactory acquirerServiceFactory,
    ILogger<PixService> logger
) : IPixService
{
    public async Task<PixGenerationResult> GeneratePixAsync(
        Guid merchantId,
        long amount,
        string? description,
        string? externalId,
        ApiEnvironment environment,
        int expirationMinutes = 30,
        string? customerName = null,
        string? customerDocument = null,
        string? customerEmail = null,
        string? customerPhone = null,
        Guid? merchantAcquirerId = null)
    {
        try
        {
            var acquirerConfig = merchantAcquirerId.HasValue
                ? await acquirerConfigService.GetAcquirerConfigByMerchantAcquirerIdAsync(merchantId, merchantAcquirerId.Value, environment)
                : await acquirerConfigService.GetDefaultAcquirerConfigAsync(merchantId, environment);

            if (acquirerConfig == null)
            {
                return new PixGenerationResult
                {
                    Success = false,
                    ErrorMessage = merchantAcquirerId.HasValue
                        ? "Adquirente selecionado não encontrado para o merchant."
                        : "Nenhum adquirente configurado para o merchant."
                };
            }

            var acquirerService = acquirerServiceFactory.GetService(acquirerConfig.AcquirerType);
            if (acquirerService == null)
            {
                logger.LogError("Acquirer service not found for type {AcquirerType}", acquirerConfig.AcquirerType);
                return new PixGenerationResult
                {
                    Success = false,
                    ErrorMessage = $"Adquirente {acquirerConfig.AcquirerType} não suportado."
                };
            }

            var request = new PixGenerationRequest
            {
                Amount = amount,
                Description = description,
                ExternalId = externalId,
                ExpirationMinutes = expirationMinutes,
                CustomerName = customerName,
                CustomerDocument = customerDocument,
                CustomerEmail = customerEmail,
                CustomerPhone = customerPhone
            };

            if (acquirerConfig.Config.IsSimulated)
            {
                return GenerateSimulatedPixResult(request, acquirerConfig.Config.AcquirerId, acquirerConfig.MerchantAcquirerId);
            }

            var result = await acquirerService.GeneratePixAsync(acquirerConfig.Config, request);
            
            return result with
            {
                AcquirerId = acquirerConfig.Config.AcquirerId,
                MerchantAcquirerId = acquirerConfig.MerchantAcquirerId
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error generating PIX for merchant {MerchantId}", merchantId);
            return new PixGenerationResult
            {
                Success = false,
                ErrorMessage = "Erro interno ao gerar PIX."
            };
        }
    }

    public async Task<PixStatusResult> GetPixStatusAsync(Guid merchantId, string txId, ApiEnvironment environment)
    {
        try
        {
            var acquirerConfig = await acquirerConfigService.GetDefaultAcquirerConfigAsync(merchantId, environment);
            if (acquirerConfig == null)
            {
                return new PixStatusResult
                {
                    Success = false,
                    ErrorMessage = "Nenhum adquirente configurado."
                };
            }

            var acquirerService = acquirerServiceFactory.GetService(acquirerConfig.AcquirerType);
            if (acquirerService == null)
            {
                return new PixStatusResult
                {
                    Success = false,
                    ErrorMessage = $"Adquirente {acquirerConfig.AcquirerType} não suportado."
                };
            }

            if (acquirerConfig.Config.IsSimulated)
            {
                return GetSimulatedPixStatusResult(txId);
            }

            return await acquirerService.GetPixStatusAsync(acquirerConfig.Config, txId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting PIX status for txId {TxId}", txId);
            return new PixStatusResult
            {
                Success = false,
                ErrorMessage = "Erro interno ao consultar status."
            };
        }
    }

    private static PixGenerationResult GenerateSimulatedPixResult(PixGenerationRequest request, Guid acquirerId, Guid merchantAcquirerId)
    {
        var paymentId = request.ExternalId ?? Guid.CreateVersion7().ToString("N");
        var txId = $"sandbox_{paymentId}";
        var expiresAt = DateTime.UtcNow.AddMinutes(request.ExpirationMinutes);

        return new PixGenerationResult
        {
            Success = true,
            AcquirerId = acquirerId,
            MerchantAcquirerId = merchantAcquirerId,
            TxId = txId,
            AcquirerPaymentId = txId,
            QrCode = $"SANDBOX_QR_CODE_{paymentId}",
            CopyAndPaste = $"00020126580014br.gov.bcb.pix0136sandbox{paymentId}5204000053039865802BR5925SAFEFY SANDBOX6009SAO PAULO62070503***6304XXXX",
            ExpiresAt = expiresAt
        };
    }

    private static PixStatusResult GetSimulatedPixStatusResult(string txId)
    {
        return new PixStatusResult
        {
            Success = true,
            Status = PaymentStatus.Pending,
            EndToEndId = $"E00000000{DateTime.UtcNow:yyyyMMddHHmmss}{txId[^8..]}",
            PayerName = null,
            PayerDocument = null,
            CompletedAt = null
        };
    }
}
