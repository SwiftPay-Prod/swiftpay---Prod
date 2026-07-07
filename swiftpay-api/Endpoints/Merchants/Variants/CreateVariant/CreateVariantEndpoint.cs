using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Merchants.Variants.CreateVariant;

public sealed class CreateVariantEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<CreateVariantRequest, CreateVariantResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/products/{productId:guid}/variants");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(CreateVariantRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreateVariantResponse
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
            await Send.ResponseAsync(new CreateVariantResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var product = await dbContext.Products
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.ProductId && p.MerchantId == req.MerchantId, ct);

        if (product == null)
        {
            await Send.ResponseAsync(new CreateVariantResponse
            {
                Error = new("Produto não encontrado.")
            }, 404, ct);
            return;
        }

        if (product.IsUnlimitedDigitalStock && req.StockQuantity.HasValue)
        {
            await Send.ResponseAsync(new CreateVariantResponse
            {
                Error = new("Não é permitido definir estoque quando o produto está com estoque ilimitado.")
            }, 400, ct);
            return;
        }

        if (!string.IsNullOrWhiteSpace(req.ExternalId))
        {
            var existingByExternalId = await dbContext.Variants
                .OrderBy(v => v.Id)
                .FirstOrDefaultAsync(v => v.ProductId == req.ProductId && v.ExternalId == req.ExternalId, ct);

            if (existingByExternalId != null)
            {
                await Send.ResponseAsync(new CreateVariantResponse
                {
                    Error = new("Já existe uma variante com este ID externo.")
                }, 400, ct);
                return;
            }
        }

        var variant = new Variant
        {
            Id = Guid.CreateVersion7(),
            ProductId = req.ProductId,
            ExternalId = req.ExternalId,
            Name = req.Name,
            SKU = req.SKU,
            Price = req.Price,
            StockQuantity = req.StockQuantity,
            ImageUrl = req.ImageUrl,
            Status = VariantStatus.Active
        };

        dbContext.Variants.Add(variant);
        await dbContext.SaveChangesAsync(ct);

        await Send.CreatedAtAsync<CreateVariantEndpoint>(null, new CreateVariantResponse
        {
            Data = VariantMapper.ToData(variant),
            Message = "Variante criada com sucesso!"
        }, cancellation: ct);
    }
}
