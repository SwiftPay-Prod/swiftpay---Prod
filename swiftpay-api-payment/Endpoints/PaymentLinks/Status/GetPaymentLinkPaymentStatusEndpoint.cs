using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_payment.EndpointsGroups;

namespace swiftpay_api_payment.Endpoints.PaymentLinks.Status;

public sealed class GetPaymentLinkPaymentStatusEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<GetPaymentLinkPaymentStatusRequest, GetPaymentLinkPaymentStatusResponse>
{
    public override void Configure()
    {
        Get("{token}/payments/{paymentId:guid}/status");
        Group<PaymentLinksGroup>();
        AllowAnonymous();
    }

    public override async Task HandleAsync(GetPaymentLinkPaymentStatusRequest req, CancellationToken ct)
    {
        var paymentLink = await dbContext.PaymentLinks
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(pl => pl.Token == req.Token, ct);

        if (paymentLink == null)
        {
            await Send.ResponseAsync(new GetPaymentLinkPaymentStatusResponse
            {
                Error = new("Link de pagamento não encontrado.")
            }, 404, ct);
            return;
        }

        var payment = await dbContext.Payments
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == req.PaymentId
                && p.MerchantId == paymentLink.MerchantId
                && p.Environment == paymentLink.Environment
                && !p.SuppressMerchantVisibility, ct);

        if (payment == null)
        {
            await Send.ResponseAsync(new GetPaymentLinkPaymentStatusResponse
            {
                Error = new("Pagamento não encontrado para este link.")
            }, 404, ct);
            return;
        }

        await Send.OkAsync(new GetPaymentLinkPaymentStatusResponse
        {
            Data = new GetPaymentLinkPaymentStatusData
            {
                Status = payment.Status,
                CompletedAt = payment.CompletedAt
            }
        }, ct);
    }
}
