using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Products.DigitalItems.CreateDigitalItem;

public sealed class CreateDigitalItemEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<CreateDigitalItemRequest, CreateDigitalItemResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/products/{productId:guid}/digital-items");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(CreateDigitalItemRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreateDigitalItemResponse
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
            await Send.ResponseAsync(new CreateDigitalItemResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var product = await dbContext.Products
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.ProductId && p.MerchantId == req.MerchantId, ct);

        if (product == null)
        {
            await Send.ResponseAsync(new CreateDigitalItemResponse
            {
                Error = new("Produto não encontrado.")
            }, 404, ct);
            return;
        }

        if (product.Type != ProductType.Digital)
        {
            await Send.ResponseAsync(new CreateDigitalItemResponse
            {
                Error = new("Este produto não é digital. Itens digitais só podem ser adicionados a produtos do tipo Digital.")
            }, 400, ct);
            return;
        }

        if (req.VariantId.HasValue)
        {
            var variant = await dbContext.Variants
                .AsNoTracking()
                .OrderBy(v => v.Id)
                .FirstOrDefaultAsync(v => v.Id == req.VariantId && v.ProductId == req.ProductId, ct);

            if (variant == null)
            {
                await Send.ResponseAsync(new CreateDigitalItemResponse
                {
                    Error = new("Variante não encontrada.")
                }, 404, ct);
                return;
            }
        }

        if (product.IsUnlimitedDigitalStock)
        {
            var existingCount = await dbContext.DigitalItems
                .AsNoTracking()
                .CountAsync(di => di.ProductId == req.ProductId && di.VariantId == req.VariantId, ct);

            if (existingCount >= 1)
            {
                await Send.ResponseAsync(new CreateDigitalItemResponse
                {
                    Error = new("Este produto está com estoque ilimitado e permite apenas 1 item digital por variante.")
                }, 400, ct);
                return;
            }
        }

        var existingItem = await dbContext.DigitalItems
            .AsNoTracking()
            .OrderBy(di => di.Id)
            .FirstOrDefaultAsync(di => di.ProductId == req.ProductId && di.Content == req.Content, ct);

        if (existingItem != null)
        {
            await Send.ResponseAsync(new CreateDigitalItemResponse
            {
                Error = new("Este conteúdo já existe neste produto.")
            }, 400, ct);
            return;
        }

        var digitalItem = new DigitalItem
        {
            ProductId = req.ProductId,
            VariantId = req.VariantId,
            Type = req.Type,
            Content = req.Content.Trim(),
            Label = req.Label?.Trim(),
            Status = DigitalItemStatus.Available
        };

        dbContext.DigitalItems.Add(digitalItem);
        await dbContext.SaveChangesAsync(ct);

        await Send.ResponseAsync(new CreateDigitalItemResponse
        {
            Data = DigitalItemMapper.ToData(digitalItem),
            Message = "Item digital adicionado com sucesso!"
        }, 201, ct);
    }
}
