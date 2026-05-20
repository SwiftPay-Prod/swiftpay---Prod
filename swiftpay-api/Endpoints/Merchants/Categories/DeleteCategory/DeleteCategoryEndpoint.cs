using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Categories.DeleteCategory;

public sealed class DeleteCategoryEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<DeleteCategoryRequest, DeleteCategoryResponse>
{
    public override void Configure()
    {
        Delete("{merchantId:guid}/categories/{categoryId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(DeleteCategoryRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new DeleteCategoryResponse
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
            await Send.ResponseAsync(new DeleteCategoryResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var category = await dbContext.Categories
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c => c.Id == req.CategoryId && c.MerchantId == req.MerchantId, ct);

        if (category == null)
        {
            await Send.ResponseAsync(new DeleteCategoryResponse
            {
                Error = new("Categoria não encontrada.")
            }, 404, ct);
            return;
        }

        dbContext.Categories.Remove(category);
        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new DeleteCategoryResponse
        {
            Message = "Categoria excluída com sucesso!"
        }, ct);
    }
}
