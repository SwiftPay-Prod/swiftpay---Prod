using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Merchants.Checkouts.DeleteCheckout;

public sealed class DeleteCheckoutEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<DeleteCheckoutRequest, DeleteCheckoutResponse>
{
    public override void Configure()
    {
        Delete("{merchantId:guid}/checkouts/{checkoutId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(DeleteCheckoutRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new DeleteCheckoutResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new DeleteCheckoutResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var checkout = await dbContext.Checkouts
            .Include(c => c.Orders)
            .Include(c => c.CheckoutTemplate)
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c => c.Id == req.CheckoutId && c.MerchantId == req.MerchantId, ct);

        if (checkout == null)
        {
            await Send.ResponseAsync(new DeleteCheckoutResponse
            {
                Error = new("Checkout não encontrado.")
            }, 404, ct);
            return;
        }

        // Decrementar ActiveCheckouts do template se checkout estava ativo e tinha template
        var shouldDecrementTemplate = checkout.Status != CheckoutStatus.Archived 
                                      && checkout.CheckoutTemplate != null;

        if (checkout.Orders.Count > 0)
        {
            checkout.Status = CheckoutStatus.Archived;
            
            if (shouldDecrementTemplate)
            {
                checkout.CheckoutTemplate!.ActiveCheckouts = Math.Max(0, checkout.CheckoutTemplate.ActiveCheckouts - 1);
            }
            
            await dbContext.SaveChangesAsync(ct);

            await Send.OkAsync(new DeleteCheckoutResponse
            {
                Message = "Checkout arquivado com sucesso. Não foi possível excluir pois existem pagamentos vinculados."
            }, ct);
            return;
        }

        if (shouldDecrementTemplate)
        {
            checkout.CheckoutTemplate!.ActiveCheckouts = Math.Max(0, checkout.CheckoutTemplate.ActiveCheckouts - 1);
        }

        dbContext.Checkouts.Remove(checkout);
        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new DeleteCheckoutResponse
        {
            Message = "Checkout excluído com sucesso!"
        }, ct);
    }
}
