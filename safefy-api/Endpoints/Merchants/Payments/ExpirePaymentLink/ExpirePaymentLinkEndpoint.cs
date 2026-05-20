using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.Endpoints.Models;
using safefy_api.EndpointsGroups;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Payments.ExpirePaymentLink;

public sealed class ExpirePaymentLinkEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ExpirePaymentLinkRequest, ExpirePaymentLinkResponse>
{
    public override void Configure()
    {
        Patch("{merchantId:guid}/payment-links/{paymentLinkId:guid}/expire");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ExpirePaymentLinkRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ExpirePaymentLinkResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .AsNoTracking()
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ExpirePaymentLinkResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new ExpirePaymentLinkResponse
            {
                Error = new("Organização inativa.")
            }, 403, ct);
            return;
        }

        var paymentLink = await dbContext.PaymentLinks
            .Include(pl => pl.Payment)
            .FirstOrDefaultAsync(pl => pl.Id == req.PaymentLinkId && pl.MerchantId == req.MerchantId, ct);

        if (paymentLink == null)
        {
            await Send.ResponseAsync(new ExpirePaymentLinkResponse
            {
                Error = new("Link de pagamento não encontrado.")
            }, 404, ct);
            return;
        }

        if (!paymentLink.ExpiresAt.HasValue || paymentLink.ExpiresAt.Value > DateTime.UtcNow)
        {
            await Send.ResponseAsync(new ExpirePaymentLinkResponse
            {
                Error = new("Link não expirou ainda.")
            }, 400, ct);
            return;
        }

        if (paymentLink.Payment == null || paymentLink.Payment.Status != PaymentStatus.Pending)
        {
            await Send.OkAsync(new ExpirePaymentLinkResponse(), ct);
            return;
        }

        paymentLink.Payment.Status = PaymentStatus.Expired;
        paymentLink.Payment.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new ExpirePaymentLinkResponse(), ct);
    }
}
