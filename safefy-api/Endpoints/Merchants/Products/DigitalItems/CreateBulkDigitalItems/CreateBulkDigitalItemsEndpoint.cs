using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Products.DigitalItems.CreateBulkDigitalItems;

public sealed class CreateBulkDigitalItemsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<CreateBulkDigitalItemsRequest, CreateBulkDigitalItemsResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/products/{productId:guid}/digital-items/bulk");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(CreateBulkDigitalItemsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreateBulkDigitalItemsResponse
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
            await Send.ResponseAsync(new CreateBulkDigitalItemsResponse
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
            await Send.ResponseAsync(new CreateBulkDigitalItemsResponse
            {
                Error = new("Produto não encontrado.")
            }, 404, ct);
            return;
        }

        if (product.Type != ProductType.Digital)
        {
            await Send.ResponseAsync(new CreateBulkDigitalItemsResponse
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
                await Send.ResponseAsync(new CreateBulkDigitalItemsResponse
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
                await Send.ResponseAsync(new CreateBulkDigitalItemsResponse
                {
                    Error = new("Este produto está com estoque ilimitado e permite apenas 1 item digital por variante.")
                }, 400, ct);
                return;
            }

            var incomingCount = req.Contents
                .Select(content => content?.Trim())
                .Where(content => !string.IsNullOrWhiteSpace(content))
                .Distinct()
                .Count();

            if (incomingCount > 1)
            {
                await Send.ResponseAsync(new CreateBulkDigitalItemsResponse
                {
                    Error = new("Este produto está com estoque ilimitado e permite apenas 1 item digital por variante.")
                }, 400, ct);
                return;
            }
        }

        var existingContents = await dbContext.DigitalItems
            .AsNoTracking()
            .Where(di => di.ProductId == req.ProductId)
            .Select(di => di.Content)
            .ToListAsync(ct);

        var existingSet = new HashSet<string>(existingContents);
        var createdCount = 0;
        var skippedItems = new List<string>();
        var processedContents = new HashSet<string>();

        foreach (var content in req.Contents)
        {
            var trimmedContent = content.Trim();

            if (string.IsNullOrWhiteSpace(trimmedContent))
            {
                continue;
            }

            if (trimmedContent.Length > 2000)
            {
                skippedItems.Add(trimmedContent.Substring(0, 20) + "... (muito longo)");
                continue;
            }

            if (existingSet.Contains(trimmedContent) || processedContents.Contains(trimmedContent))
            {
                skippedItems.Add(trimmedContent.Length > 20 ? trimmedContent.Substring(0, 20) + "... (duplicado)" : trimmedContent + " (duplicado)");
                continue;
            }

            var digitalItem = new DigitalItem
            {
                ProductId = req.ProductId,
                VariantId = req.VariantId,
                Type = req.Type,
                Content = trimmedContent,
                Label = req.Label?.Trim(),
                Status = DigitalItemStatus.Available
            };

            dbContext.DigitalItems.Add(digitalItem);
            processedContents.Add(trimmedContent);
            createdCount++;
        }

        await dbContext.SaveChangesAsync(ct);

        await Send.ResponseAsync(new CreateBulkDigitalItemsResponse
        {
            Data = new CreateBulkDigitalItemsData
            {
                CreatedCount = createdCount,
                SkippedCount = skippedItems.Count,
                SkippedItems = skippedItems.Take(10).ToList()
            },
            Message = $"{createdCount} itens digitais adicionados com sucesso!"
        }, 201, ct);
    }
}
