using FastEndpoints;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Constants;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Hubs;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Admin.Users.InactivateUser;

public sealed class InactivateUserEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    IHubContext<MainHub> authHub,
    IPushNotificationService pushNotificationService
) : Endpoint<InactivateUserRequest, InactivateUserResponse>
{
    public override void Configure()
    {
        Post("users/{userId:guid}/inactivate");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(InactivateUserRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new InactivateUserResponse
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
            await Send.ResponseAsync(new InactivateUserResponse
            {
                Error = new("Usuário não encontrado.")
            }, 404, ct);
            return;
        }

        if (dbUser.Status == UserStatus.Inactive)
        {
            await Send.ResponseAsync(new InactivateUserResponse
            {
                Error = new("O usuário já está inativo.")
            }, 400, ct);
            return;
        }

        if (dbUser.Role == UserRole.God)
        {
            await Send.ResponseAsync(new InactivateUserResponse
            {
                Error = new("Não é possível inativar esse usuário.")
            }, 403, ct);
            return;
        }

        if (dbUser.Id == adminId)
        {
            await Send.ResponseAsync(new InactivateUserResponse
            {
                Error = new("Você não pode inativar a si mesmo.")
            }, 400, ct);
            return;
        }

        var previousStatus = dbUser.Status;

        dbUser.Status = UserStatus.Inactive;
        dbUser.InactiveReason = req.Reason;
        dbUser.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        await pushNotificationService.UnregisterAllTokensAsync(dbUser.Id);

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.ProfileUpdate, Status = SecurityLogStatus.Success, UserId = adminId, Details = $"Usuário {dbUser.Id} inativado. Status anterior: {previousStatus}. Motivo: {req.Reason}" });

        await authHub.Clients.Group(SignalRGroups.User(dbUser.Id)).SendAsync(SignalRMethods.UserStatusChanged, UserMapper.ToUserInfo(dbUser), ct);

        await Send.OkAsync(new InactivateUserResponse
        {
            Data = new("Usuário inativado com sucesso.")
        }, ct);
    }
}
