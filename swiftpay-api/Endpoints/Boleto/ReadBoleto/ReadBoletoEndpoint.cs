using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Boleto.ReadBoleto;

public sealed class ReadBoletoEndpoint(
    PrimaryDbContext dbContext
) : EndpointWithoutRequest<ReadBoletoResponse>
{
    public override void Configure()
    {
        Get("{paymentId:guid}");
        Group<BoletoGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var paymentId = Route<Guid>("paymentId");

        var payment = await dbContext.Payments
            .AsNoTracking()
            .Include(p => p.PaymentBoleto)
            .Include(p => p.Merchant)
            .IgnoreQueryFilters()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == paymentId && p.Method == PaymentMethod.Boleto, ct);

        if (payment?.PaymentBoleto == null)
        {
            await Send.ResponseAsync(new ReadBoletoResponse
            {
                Error = new("Boleto não encontrado.")
            }, 404, ct);
            return;
        }

        var isExpired = payment.Status == PaymentStatus.Expired
            || (payment.PaymentBoleto.DueDate.HasValue && payment.PaymentBoleto.DueDate.Value.Date < DateTime.UtcNow.Date);

        var boletoUrl = payment.PaymentBoleto.PdfUrl;

        await Send.OkAsync(new ReadBoletoResponse
        {
            Data = new ReadBoletoData
            {
                PaymentId = payment.Id,
                MerchantName = payment.Merchant?.Name ?? "Safefy",
                Amount = payment.Amount,
                Description = payment.Description,
                Status = payment.Status.ToString(),
                Barcode = payment.PaymentBoleto.Barcode,
                DigitableLine = payment.PaymentBoleto.DigitableLine,
                PdfUrl = payment.PaymentBoleto.PdfUrl,
                BoletoUrl = boletoUrl,
                DueDate = payment.PaymentBoleto.DueDate,
                IsExpired = isExpired,
                CreatedAt = payment.CreatedAt
            }
        }, ct);
    }
}
