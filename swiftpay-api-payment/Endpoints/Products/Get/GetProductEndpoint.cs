using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_payment.Documentation;
using swiftpay_api_payment.EndpointsGroups;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_payment.Endpoints.Utils;
using swiftpay_api_payment.Mappers;

namespace swiftpay_api_payment.Endpoints.Products.Get;

public sealed class GetProductEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<GetProductRequest, GetProductResponse>
{
    public override void Configure()
    {
        Get("{productId:guid}");
        Group<ProductsGroup>();
        Description(d => d
            .WithName("ObterProduto")
            .WithSummary("Obtém um produto pelo ID")
            .WithDescription(EndpointDescriptions.Products.Get)
            .Produces<GetProductResponse>(200, "application/json")
            .Produces<BaseResponse>(401, "application/json")
            .Produces<BaseResponse>(404, "application/json"));
    }

    public override async Task HandleAsync(GetProductRequest req, CancellationToken ct)
    {
        var merchantId = PaymentEndpointUtils.GetMerchantId(User);

        if (merchantId == null)
        {
            await Send.ResponseAsync(new GetProductResponse
            {
                Error = new ApiErrorResponse("Token inválido.", "invalid_token")
            }, 401, cancellation: ct);
            return;
        }

        var product = await dbContext.Products
            .Include(p => p.Categories)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == req.ProductId && p.MerchantId == merchantId, ct);

        if (product == null)
        {
            await Send.ResponseAsync(new GetProductResponse
            {
                Error = new ApiErrorResponse("Produto não encontrado.", "product_not_found")
            }, 404, cancellation: ct);
            return;
        }

        await Send.ResponseAsync(new GetProductResponse
        {
            Data = ProductMapper.ToData(product)
        }, 200, cancellation: ct);
    }
}
