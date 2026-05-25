using Microsoft.Extensions.Options;

namespace Swiftpay.Api.Core.Services;

public class FeeScheduleOptions
{
    public decimal CashInPercent { get; set; } = 5.00m;
    public long CashInFixed { get; set; } = 180;
    public decimal AcquirerPercent { get; set; } = 3.00m;
    public long AcquirerFixed { get; set; } = 100;
}

public record FeeCalculationResult(
    long PlatformFee, long AcquirerFee, long NetAmount,
    long MerchantSettlementAmount, long AcquirerNetAmount);

public class FeeCalculationService
{
    private readonly FeeScheduleOptions _options;

    public FeeCalculationService(IOptions<FeeScheduleOptions> options)
    {
        _options = options.Value;
    }

    public FeeCalculationResult CalculatePixFees(long amount)
    {
        if (amount <= 0) return new(0, 0, 0, 0, 0);
        var platformFee = (long)(amount * _options.CashInPercent / 100) + _options.CashInFixed;
        var acquirerFee = (long)(amount * _options.AcquirerPercent / 100) + _options.AcquirerFixed;
        var merchantSettlement = amount - platformFee;
        var netAmount = merchantSettlement - acquirerFee;
        var acquirerNetAmount = amount - netAmount - acquirerFee;
        return new(platformFee, acquirerFee, netAmount, merchantSettlement, acquirerNetAmount);
    }
}
