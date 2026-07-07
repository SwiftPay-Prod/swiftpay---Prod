using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Merchants.Products.ReadProduct;

public sealed class ReadProductEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadProductRequest, ReadProductResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/products/{productId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadProductRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadProductResponse
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
            await Send.ResponseAsync(new ReadProductResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var product = await dbContext.Products
            .Include(p => p.Categories)
            .Include(p => p.Variants)
            .Include(p => p.Coupons)
            .Include(p => p.DigitalItems)
            .AsSplitQuery()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.ProductId && p.MerchantId == req.MerchantId, ct);

        if (product == null)
        {
            await Send.ResponseAsync(new ReadProductResponse
            {
                Error = new("Produto não encontrado.")
            }, 404, ct);
            return;
        }

        await Send.OkAsync(new ReadProductResponse
        {
            Data = ProductMapper.ToData(product)
        }, ct);
    }
}
