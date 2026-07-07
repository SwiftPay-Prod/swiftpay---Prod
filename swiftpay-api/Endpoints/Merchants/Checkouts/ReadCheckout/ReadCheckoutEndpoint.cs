using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api.Mappers;
using swiftpay_api_core.Models.Settings;

namespace swiftpay_api.Endpoints.Merchants.Checkouts.ReadCheckout;

public sealed class ReadCheckoutEndpoint(
    PrimaryDbContext dbContext,
    IOptions<PlatformSettingsOptions> platformSettings
) : Endpoint<ReadCheckoutRequest, ReadCheckoutResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/checkouts/{checkoutId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadCheckoutRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadCheckoutResponse
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
            await Send.ResponseAsync(new ReadCheckoutResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var checkout = await dbContext.Checkouts
            .Include(c => c.CheckoutTemplate)
            .Include(c => c.Config)
            .Include(c => c.CheckoutProducts)
                .ThenInclude(cp => cp.Product)
            .Include(c => c.CheckoutProducts)
                .ThenInclude(cp => cp.Variant)
            .Include(c => c.Coupons)
            .Include(c => c.Orders)
                .ThenInclude(o => o.Payment)
            .AsSplitQuery()
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c => c.Id == req.CheckoutId && c.MerchantId == req.MerchantId, ct);

        if (checkout == null)
        {
            await Send.ResponseAsync(new ReadCheckoutResponse
            {
                Error = new("Checkout não encontrado.")
            }, 404, ct);
            return;
        }

        await Send.OkAsync(new ReadCheckoutResponse
        {
            Data = CheckoutMapper.ToData(checkout, platformSettings.Value.CheckoutBaseUrl)
        }, ct);
    }
}
