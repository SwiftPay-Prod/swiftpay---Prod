using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Admin.Users.ActivateUser;

public sealed class ActivateUserEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog
) : Endpoint<ActivateUserRequest, ActivateUserResponse>
{
    public override void Configure()
    {
        Post("users/{userId:guid}/activate");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ActivateUserRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new ActivateUserResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var dbUser = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == req.UserId, ct);

        if (dbUser == null)
        {
            await Send.ResponseAsync(new ActivateUserResponse
            {
                Error = new("Usuário não encontrado.")
            }, 404, ct);
            return;
        }

        if (dbUser.Status == UserStatus.Active)
        {
            await Send.ResponseAsync(new ActivateUserResponse
            {
                Error = new("O usuário já está ativo.")
            }, 400, ct);
            return;
        }

        var previousStatus = dbUser.Status;

        dbUser.Status = UserStatus.Active;
        dbUser.InactiveReason = null;
        dbUser.SuspendedReason = null;
        dbUser.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        var reasonLog = string.IsNullOrWhiteSpace(req.Reason) ? "" : $" Motivo: {req.Reason}";
        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.ProfileUpdate, Status = SecurityLogStatus.Success, UserId = adminId, Details = $"Usuário {dbUser.Id} ativado. Status anterior: {previousStatus}.{reasonLog}" });

        await Send.OkAsync(new ActivateUserResponse
        {
            Data = new("Usuário ativado com sucesso.")
        }, ct);
    }
}
