namespace Swiftpay.Api.Core.Services;

public record FeeCalculationResult(
    long PlatformFee, long AcquirerFee, long NetAmount,
    long MerchantSettlementAmount, long AcquirerNetAmount);

public class FeeCalculationService
{
    private const decimal CashInPercent = 5.00m;
    private const long CashInFixed = 180;
    private const decimal AcquirerPercent = 3.00m;
    private const long AcquirerFixed = 100;

    public FeeCalculationResult CalculatePixFees(long amount)
    {
        if (amount <= 0) return new(0, 0, 0, 0, 0);

        var platformFee = (long)(amount * CashInPercent / 100) + CashInFixed;
        var acquirerFee = (long)(amount * AcquirerPercent / 100) + AcquirerFixed;
        var merchantSettlement = amount - platformFee;
        var netAmount = merchantSettlement - acquirerFee;
        var acquirerNetAmount = amount - netAmount - acquirerFee;

        return new(platformFee, acquirerFee, netAmount, merchantSettlement, acquirerNetAmount);
    }
}
