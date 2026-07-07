using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api_payment.Services;

public sealed class AcquirerNominalTrackingService(
    PrimaryDbContext dbContext
) : IAcquirerNominalTrackingService
{
    public async Task TrackNominalFromPixAsync(
        Guid acquirerId,
        Guid paymentId,
        string? copyAndPaste,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(copyAndPaste))
            return;

        var detectedNominal = PixEMVParser.ExtractProcessingNominal(copyAndPaste)?.Trim();
        var detectedMerchantName = PixEMVParser.ExtractMerchantName(copyAndPaste)?.Trim();

        if (string.IsNullOrWhiteSpace(detectedNominal))
            return;

        var detected = BuildCombinedNominal(detectedMerchantName, detectedNominal);

        var acquirer = await dbContext.Acquirers
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync(a => a.Id == acquirerId, ct);

        if (acquirer == null)
            return;

        if (string.Equals(acquirer.Nominal, detected, StringComparison.OrdinalIgnoreCase))
            return;

        var previousNominal = acquirer.Nominal;

        acquirer.Nominal = detected;

        var payment = await dbContext.Payments
            .FirstOrDefaultAsync(p => p.Id == paymentId, ct);

        if (payment != null)
        {
            payment.AcquirerNominal = detected;
        }

        dbContext.AcquirerPixNominalHistories.Add(new AcquirerPixNominalHistory
        {
            Id = Guid.CreateVersion7(),
            AcquirerId = acquirerId,
            PreviousNominal = previousNominal,
            NewNominal = detected,
            Source = AcquirerNominalChangeSource.Automatic,
            DetectedFromPaymentId = paymentId
        });

        await dbContext.SaveChangesAsync(ct);
    }

    private static string BuildCombinedNominal(string? merchantName, string nominal)
    {
        var nominalTrimmed = nominal.Trim();
        var merchantNameTrimmed = merchantName?.Trim();

        if (string.IsNullOrWhiteSpace(merchantNameTrimmed))
            return nominalTrimmed;

        return $"{merchantNameTrimmed} ({nominalTrimmed})";
    }
}
