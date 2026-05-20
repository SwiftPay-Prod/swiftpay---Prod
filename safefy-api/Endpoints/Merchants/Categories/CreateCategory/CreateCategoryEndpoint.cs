using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Models.Database;
using safefy_api.Mappers;

namespace safefy_api.Endpoints.Merchants.Categories.CreateCategory;

public sealed class CreateCategoryEndpoint(
    PrimaryDbContext dbContext,
    IEnvironmentProvider environmentProvider
) : Endpoint<CreateCategoryRequest, CreateCategoryResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/categories");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(CreateCategoryRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreateCategoryResponse
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
            await Send.ResponseAsync(new CreateCategoryResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (!string.IsNullOrWhiteSpace(req.ExternalId))
        {
            var existingByExternalId = await dbContext.Categories
                .OrderBy(c => c.Id)
                .FirstOrDefaultAsync(c => c.MerchantId == req.MerchantId && c.ExternalId == req.ExternalId, ct);

            if (existingByExternalId != null)
            {
                await Send.ResponseAsync(new CreateCategoryResponse
                {
                    Error = new("Já existe uma categoria com este ID externo neste ambiente.")
                }, 400, ct);
                return;
            }
        }

        var category = new Category
        {
            Id = Guid.CreateVersion7(),
            MerchantId = req.MerchantId,
            ExternalId = req.ExternalId,
            Name = req.Name,
            Description = req.Description,
            Status = CategoryStatus.Active,
            Environment = environmentProvider.CurrentEnvironment
        };

        dbContext.Categories.Add(category);
        await dbContext.SaveChangesAsync(ct);

        await Send.CreatedAtAsync<CreateCategoryEndpoint>(null, new CreateCategoryResponse
        {
            Data = CategoryMapper.ToData(category),
            Message = "Categoria criada com sucesso!"
        }, cancellation: ct);
    }
}
