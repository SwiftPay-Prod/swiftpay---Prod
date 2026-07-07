using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Users.SelectBorder;

public sealed class SelectBorderEndpoint(
    PrimaryDbContext dbContext,
    IAchievementService achievementService
) : Endpoint<SelectBorderRequest, SelectBorderResponse>
{
    public override void Configure()
    {
        Patch("border");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(SelectBorderRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new SelectBorderResponse { Error = new("Token inválido.") }, 401, ct);
            return;
        }

        var user = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null)
        {
            await Send.ResponseAsync(new SelectBorderResponse { Error = new("Usuário não encontrado.") }, 404, ct);
            return;
        }

        if (req.BorderLevel != null)
        {
            if (!Enum.TryParse<MerchantLevel>(req.BorderLevel, out var requestedLevel))
            {
                await Send.ResponseAsync(new SelectBorderResponse { Error = new("Nível de borda inválido.") }, 400, ct);
                return;
            }

            var merchantIds = await dbContext.Merchants
                .Where(m => m.UserId == userId)
                .Select(m => m.Id)
                .ToListAsync(ct);

            var totalVolume = merchantIds.Count > 0
                ? await dbContext.Payments
                    .IgnoreQueryFilters()
                    .Where(p => merchantIds.Contains(p.MerchantId)
                        && p.Status == PaymentStatus.Completed
                        && p.Environment == ApiEnvironment.Production)
                    .SumAsync(p => (long?)p.Amount, ct) ?? 0L
                : 0L;

            var currentLevel = achievementService.ComputeLevel(totalVolume);

            if (requestedLevel > currentLevel)
            {
                await Send.ResponseAsync(new SelectBorderResponse { Error = new("Nível de borda ainda não desbloqueado.") }, 400, ct);
                return;
            }

            user.SelectedBorderLevel = requestedLevel;
        }
        else
        {
            user.SelectedBorderLevel = null;
        }

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new SelectBorderResponse
        {
            Message = req.BorderLevel != null ? "Borda selecionada com sucesso!" : "Borda removida."
        }, ct);
    }
}
