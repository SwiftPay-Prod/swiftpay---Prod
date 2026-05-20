using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api.Mappers;

namespace safefy_api.Endpoints.Merchants.Categories.UpdateCategory;

public sealed class UpdateCategoryEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<UpdateCategoryRequest, UpdateCategoryResponse>
{
    public override void Configure()
    {
        Patch("{merchantId:guid}/categories/{categoryId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(UpdateCategoryRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpdateCategoryResponse
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
            await Send.ResponseAsync(new UpdateCategoryResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var category = await dbContext.Categories
            .Include(c => c.Products)
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c => c.Id == req.CategoryId && c.MerchantId == req.MerchantId, ct);

        if (category == null)
        {
            await Send.ResponseAsync(new UpdateCategoryResponse
            {
                Error = new("Categoria não encontrada.")
            }, 404, ct);
            return;
        }

        if (!string.IsNullOrWhiteSpace(req.ExternalId) && req.ExternalId != category.ExternalId)
        {
            var existingByExternalId = await dbContext.Categories
                .OrderBy(c => c.Id)
                .FirstOrDefaultAsync(c => c.MerchantId == req.MerchantId && c.Environment == category.Environment && c.ExternalId == req.ExternalId && c.Id != req.CategoryId, ct);

            if (existingByExternalId != null)
            {
                await Send.ResponseAsync(new UpdateCategoryResponse
                {
                    Error = new("Já existe uma categoria com este ID externo.")
                }, 400, ct);
                return;
            }
        }

        if (req.ExternalId != null) category.ExternalId = req.ExternalId;
        if (req.Name != null) category.Name = req.Name;
        if (req.Description != null) category.Description = req.Description;
        if (req.Status.HasValue) category.Status = req.Status.Value;

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new UpdateCategoryResponse
        {
            Data = CategoryMapper.ToData(category),
            Message = "Categoria atualizada com sucesso!"
        }, ct);
    }
}
