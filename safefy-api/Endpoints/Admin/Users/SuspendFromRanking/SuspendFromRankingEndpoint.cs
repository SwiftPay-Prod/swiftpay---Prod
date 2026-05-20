using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Interfaces;

namespace safefy_api.Endpoints.Admin.Users.SuspendFromRanking;

public sealed class SuspendFromRankingEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog
) : Endpoint<SuspendFromRankingRequest, SuspendFromRankingResponse>
{
    public override void Configure()
    {
        Post("users/{userId:guid}/ranking-suspension");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(SuspendFromRankingRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new SuspendFromRankingResponse { Error = new("Token inválido.") }, 401, ct);
            return;
        }

        var dbUser = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == req.UserId, ct);

        if (dbUser == null)
        {
            await Send.ResponseAsync(new SuspendFromRankingResponse { Error = new("Usuário não encontrado.") }, 404, ct);
            return;
        }

        if (dbUser.Role == UserRole.God)
        {
            await Send.ResponseAsync(new SuspendFromRankingResponse { Error = new("Não é possível suspender esse usuário do ranking.") }, 403, ct);
            return;
        }

        var suspendUntil = req.DurationUnit == "Hours"
            ? DateTime.UtcNow.AddHours(req.DurationValue)
            : DateTime.UtcNow.AddDays(req.DurationValue);

        dbUser.RankingSuspendedUntil = suspendUntil;
        dbUser.RankingSuspensionReason = req.Reason;
        dbUser.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.ProfileUpdate,
            Status = SecurityLogStatus.Success,
            UserId = adminId,
            Details = $"Usuário {dbUser.Id} suspenso do ranking até {suspendUntil:u}. Motivo: {req.Reason}"
        });

        await Send.OkAsync(new SuspendFromRankingResponse
        {
            Data = new("Usuário suspenso do ranking com sucesso.")
        }, ct);
    }
}
