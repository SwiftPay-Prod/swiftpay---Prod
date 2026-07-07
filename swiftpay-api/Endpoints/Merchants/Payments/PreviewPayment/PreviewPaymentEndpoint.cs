using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Calculation;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Merchants.Payments.PreviewPayment;

public sealed class PreviewPaymentEndpoint(
    PrimaryDbContext dbContext,
    IMerchantCalculationService merchantCalculationService
) : Endpoint<PreviewPaymentRequest, PreviewPaymentResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/payments/preview");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(PreviewPaymentRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new PreviewPaymentResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var exists = await dbContext.Merchants
            .AnyAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (!exists)
        {
            await Send.ResponseAsync(new PreviewPaymentResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var feeSettings = await merchantCalculationService.GetPaymentFeeSettingsAsync(
            req.MerchantId,
            req.Method,
            req.FeeContext,
            ct,
            req.Method == PaymentMethod.CreditCard ? req.Installments ?? 1 : 1);

        if (req.Amount < feeSettings.MinTransactionAmount)
        {
            await Send.ResponseAsync(new PreviewPaymentResponse
            {
                Error = new($"Valor abaixo do mínimo permitido. Mínimo: R$ {feeSettings.MinTransactionAmount / 100m:N2}")
            }, 400, ct);
            return;
        }

        if (feeSettings.MaxTransactionAmount > 0 && req.Amount > feeSettings.MaxTransactionAmount)
        {
            await Send.ResponseAsync(new PreviewPaymentResponse
            {
                Error = new($"Valor acima do máximo permitido. Máximo: R$ {feeSettings.MaxTransactionAmount / 100m:N2}")
            }, 400, ct);
            return;
        }

        var fee = FeeCalculator.Calculate(req.Amount, feeSettings.FeeMode, feeSettings.FeeFixed, feeSettings.FeePercentage);

        await Send.OkAsync(new PreviewPaymentResponse
        {
            Data = new PreviewPaymentData
            {
                Amount = req.Amount,
                Fee = fee,
                NetAmount = req.Amount - fee
            }
        }, ct);
    }
}
