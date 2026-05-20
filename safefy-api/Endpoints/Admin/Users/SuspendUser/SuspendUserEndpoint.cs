using FastEndpoints;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Constants;
using safefy_api.EndpointsGroups;
using safefy_api.Hubs;
using safefy_api_core.Utils;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Interfaces;
using safefy_api.Mappers;

namespace safefy_api.Endpoints.Admin.Users.SuspendUser;

public sealed class SuspendUserEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    IHubContext<MainHub> authHub,
    IPushNotificationService pushNotificationService
) : Endpoint<SuspendUserRequest, SuspendUserResponse>
{
    public override void Configure()
    {
        Post("users/{userId:guid}/suspend");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(SuspendUserRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new SuspendUserResponse
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
            await Send.ResponseAsync(new SuspendUserResponse
            {
                Error = new("Usuário não encontrado.")
            }, 404, ct);
            return;
        }

        if (dbUser.Status == UserStatus.Suspended)
        {
            await Send.ResponseAsync(new SuspendUserResponse
            {
                Error = new("O usuário já está suspenso.")
            }, 400, ct);
            return;
        }

        if (dbUser.Role == UserRole.God)
        {
            await Send.ResponseAsync(new SuspendUserResponse
            {
                Error = new("Não é possível suspender esse usuário.")
            }, 403, ct);
            return;
        }

        if (dbUser.Id == adminId)
        {
            await Send.ResponseAsync(new SuspendUserResponse
            {
                Error = new("Você não pode suspender a si mesmo.")
            }, 400, ct);
            return;
        }

        var previousStatus = dbUser.Status;

        dbUser.Status = UserStatus.Suspended;
        dbUser.SuspendedReason = req.Reason;
        dbUser.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        await pushNotificationService.UnregisterAllTokensAsync(dbUser.Id);

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.ProfileUpdate, Status = SecurityLogStatus.Success, UserId = adminId, Details = $"Usuário {dbUser.Id} suspenso. Status anterior: {previousStatus}. Motivo: {req.Reason}" });

        await authHub.Clients.Group(SignalRGroups.User(dbUser.Id)).SendAsync(SignalRMethods.UserStatusChanged, UserMapper.ToUserInfo(dbUser), ct);

        await Send.OkAsync(new SuspendUserResponse
        {
            Data = new("Usuário suspenso com sucesso.")
        }, ct);
    }
}
