using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.Acquirers.ReadAcquirerPixNominalHistory;

public sealed class ReadAcquirerPixNominalHistoryEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadAcquirerPixNominalHistoryRequest, ReadAcquirerPixNominalHistoryResponse>
{
    public override void Configure()
    {
        Get("acquirers/{acquirerId:guid}/pix-nominal-history");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadAcquirerPixNominalHistoryRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadAcquirerPixNominalHistoryResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var role = EndpointUtils.GetUserRole(User);
        if (role != "God" && role != "Admin")
        {
            await Send.ResponseAsync(new ReadAcquirerPixNominalHistoryResponse
            {
                Error = new("Você não tem permissão para acessar este recurso.")
            }, 403, ct);
            return;
        }

        var acquirerExists = await dbContext.Acquirers
            .AsNoTracking()
            .AnyAsync(a => a.Id == req.AcquirerId, ct);

        if (!acquirerExists)
        {
            await Send.ResponseAsync(new ReadAcquirerPixNominalHistoryResponse
            {
                Error = new("Adquirente não encontrada.")
            }, 404, ct);
            return;
        }

        var history = await dbContext.AcquirerPixNominalHistories
            .AsNoTracking()
            .Where(h => h.AcquirerId == req.AcquirerId)
            .OrderByDescending(h => h.CreatedAt)
            .Select(h => new AdminAcquirerPixNominalHistoryItem
            {
                Id = h.Id,
                MerchantName = null,
                PreviousNominal = h.PreviousNominal,
                NewNominal = h.NewNominal,
                Source = h.Source.ToString(),
                ChangedByUserId = h.ChangedByUserId,
                ChangedByUserName = h.ChangedByUserName,
                DetectedFromPaymentId = h.DetectedFromPaymentId,
                CreatedAt = h.CreatedAt
            })
            .ToListAsync(ct);

        var detectedPaymentIds = history
            .Where(x => x.DetectedFromPaymentId.HasValue)
            .Select(x => x.DetectedFromPaymentId!.Value)
            .Distinct()
            .ToList();

        if (detectedPaymentIds.Count > 0)
        {
            var pixByPaymentId = await dbContext.PaymentsPix
                .AsNoTracking()
                .Where(pp => detectedPaymentIds.Contains(pp.PaymentId))
                .Select(pp => new
                {
                    pp.PaymentId,
                    pp.CopyAndPaste,
                    pp.QrCodePayload
                })
                .ToListAsync(ct);

            var merchantNameByPaymentId = pixByPaymentId
                .Select(x => new
                {
                    x.PaymentId,
                    MerchantName = ParsePixMerchantName(x.CopyAndPaste, x.QrCodePayload)
                })
                .Where(x => !string.IsNullOrWhiteSpace(x.MerchantName))
                .ToDictionary(x => x.PaymentId, x => x.MerchantName!);

            foreach (var item in history)
            {
                if (!item.DetectedFromPaymentId.HasValue)
                    continue;

                if (merchantNameByPaymentId.TryGetValue(item.DetectedFromPaymentId.Value, out var merchantName))
                {
                    item.MerchantName = merchantName;
                }
            }
        }

        await Send.OkAsync(new ReadAcquirerPixNominalHistoryResponse
        {
            Data = history
        }, ct);
    }

    private static string? ParsePixMerchantName(string? copyAndPaste, string? qrCodePayload)
    {
        var fromCopyAndPaste = PixEMVParser.ExtractMerchantName(copyAndPaste);
        if (!string.IsNullOrWhiteSpace(fromCopyAndPaste))
        {
            return fromCopyAndPaste.Trim();
        }

        var fromQrPayload = PixEMVParser.ExtractMerchantName(qrCodePayload);
        if (!string.IsNullOrWhiteSpace(fromQrPayload))
        {
            return fromQrPayload.Trim();
        }

        return null;
    }
}
