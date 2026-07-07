using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Admin.Users.RemoveRankingSuspension;

public sealed class RemoveRankingSuspensionEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog
) : Endpoint<RemoveRankingSuspensionRequest, RemoveRankingSuspensionResponse>
{
    public override void Configure()
    {
        Delete("users/{userId:guid}/ranking-suspension");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(RemoveRankingSuspensionRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new RemoveRankingSuspensionResponse { Error = new("Token inválido.") }, 401, ct);
            return;
        }

        var dbUser = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == req.UserId, ct);

        if (dbUser == null)
        {
            await Send.ResponseAsync(new RemoveRankingSuspensionResponse { Error = new("Usuário não encontrado.") }, 404, ct);
            return;
        }

        if (dbUser.RankingSuspendedUntil == null)
        {
            await Send.ResponseAsync(new RemoveRankingSuspensionResponse { Error = new("Este usuário não está suspenso do ranking.") }, 400, ct);
            return;
        }

        dbUser.RankingSuspendedUntil = null;
        dbUser.RankingSuspensionReason = null;
        dbUser.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.ProfileUpdate,
            Status = SecurityLogStatus.Success,
            UserId = adminId,
            Details = $"Suspensão do ranking removida para o usuário {dbUser.Id}."
        });

        await Send.OkAsync(new RemoveRankingSuspensionResponse
        {
            Data = new("Suspensão do ranking removida com sucesso.")
        }, ct);
    }
}
