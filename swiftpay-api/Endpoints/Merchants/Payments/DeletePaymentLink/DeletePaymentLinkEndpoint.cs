using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Payments.DeletePaymentLink;

public sealed class DeletePaymentLinkEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<DeletePaymentLinkRequest, DeletePaymentLinkResponse>
{
    public override void Configure()
    {
        Delete("{merchantId:guid}/payment-links/{paymentLinkId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(DeletePaymentLinkRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new DeletePaymentLinkResponse
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
            await Send.ResponseAsync(new DeletePaymentLinkResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new DeletePaymentLinkResponse
            {
                Error = new("Organização não está ativa.")
            }, 403, ct);
            return;
        }

        var paymentLink = await dbContext.PaymentLinks
            .FirstOrDefaultAsync(pl => pl.Id == req.PaymentLinkId && pl.MerchantId == req.MerchantId, ct);

        if (paymentLink == null)
        {
            await Send.ResponseAsync(new DeletePaymentLinkResponse
            {
                Error = new("Link de pagamento não encontrado.")
            }, 404, ct);
            return;
        }

        dbContext.PaymentLinks.Remove(paymentLink);
        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new DeletePaymentLinkResponse
        {
            Message = "Link de pagamento removido com sucesso."
        }, ct);
    }
}
