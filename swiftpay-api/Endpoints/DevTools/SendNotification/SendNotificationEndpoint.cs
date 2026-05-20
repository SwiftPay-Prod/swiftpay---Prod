using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api_core.Constants;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.Messages;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.DevTools.SendNotification;

public sealed class SendNotificationEndpoint(
    IMessagePublisher messagePublisher,
    PrimaryDbContext dbContext
) : Endpoint<SendNotificationRequest, SendNotificationResponse>
{
    private const int BatchSize = 100;

    public override void Configure()
    {
        Post("send-notification");
        Group<DevToolsGroup>();
    }

    public override async Task HandleAsync(SendNotificationRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var userRole = EndpointUtils.GetUserRole(User);

        if (req.SendToAll)
        {
            if (userRole != nameof(UserRole.God))
            {
                await SendForbiddenAsync("Apenas usuários God podem enviar notificações para todos.", ct);
                return;
            }

            await SendToAllUsersAsync(req, ct);
            return;
        }

        var targetUserIds = await ResolveTargetUsersAsync(req, userId.Value, userRole, ct);
        if (targetUserIds == null) return;

        await SendToTargetUsersAsync(req, targetUserIds, ct);
    }

    private async Task<List<Guid>?> ResolveTargetUsersAsync(
        SendNotificationRequest req,
        Guid currentUserId,
        string? userRole,
        CancellationToken ct)
    {
        if (req.TargetUserIds is { Count: > 0 })
        {
            if (userRole != nameof(UserRole.God))
            {
                await SendForbiddenAsync("Apenas usuários God podem enviar notificações para outros usuários.", ct);
                return null;
            }

            var existingUserIds = await dbContext.Users
                .Where(u => req.TargetUserIds.Contains(u.Id))
                .Select(u => u.Id)
                .ToListAsync(ct);

            if (existingUserIds.Count != req.TargetUserIds.Count)
            {
                await SendNotFoundAsync("Um ou mais usuários não foram encontrados.", ct);
                return null;
            }

            return req.TargetUserIds;
        }

        if (req.TargetUserId.HasValue)
        {
            if (userRole != nameof(UserRole.God))
            {
                await SendForbiddenAsync("Apenas usuários God podem enviar notificações para outros usuários.", ct);
                return null;
            }

            var exists = await dbContext.Users.AnyAsync(u => u.Id == req.TargetUserId.Value, ct);
            if (!exists)
            {
                await SendNotFoundAsync("Usuário alvo não encontrado.", ct);
                return null;
            }

            return [req.TargetUserId.Value];
        }

        return [currentUserId];
    }

    private async Task SendToAllUsersAsync(SendNotificationRequest req, CancellationToken ct)
    {
        if (!messagePublisher.IsEnabled)
        {
            await SendErrorAsync("Sistema de filas não disponível.", 503, ct);
            return;
        }

        var allUserIds = await dbContext.Users
            .Where(u => u.Status == UserStatus.Active)
            .Select(u => u.Id)
            .ToListAsync(ct);

        if (allUserIds.Count == 0)
        {
            await SendNotFoundAsync("Nenhum usuário ativo encontrado.", ct);
            return;
        }

        var data = BuildNotificationData(req);
        var totalBatches = (int)Math.Ceiling(allUserIds.Count / (double)BatchSize);

        for (var i = 0; i < allUserIds.Count; i += BatchSize)
        {
            var batch = allUserIds.Skip(i).Take(BatchSize).ToList();

            await messagePublisher.PublishAsync(
                RabbitMQQueues.CreateBulkUserNotification,
                new CreateBulkUserNotificationMessage(
                    UserIds: batch,
                    NotificationType: req.NotificationType,
                    StatusType: req.StatusType,
                    Priority: req.Priority,
                    Title: req.Title,
                    Message: req.Message,
                    ActionUrl: req.ActionUrl,
                    ActionLabel: req.ActionUrl != null ? "Ver detalhes" : null,
                    SendInApp: req.SendInApp,
                    SendPush: req.SendPush,
                    PushData: data
                ));
        }

        await SendSuccessAsync(
            allUserIds.Count,
            true,
            $"Processando {allUserIds.Count} usuários em {totalBatches} lotes de {BatchSize}",
            null,
            ct);
    }

    private async Task SendToTargetUsersAsync(
        SendNotificationRequest req,
        List<Guid> targetUserIds,
        CancellationToken ct)
    {
        if (!messagePublisher.IsEnabled)
        {
            await SendErrorAsync("Sistema de filas não disponível.", 503, ct);
            return;
        }

        var data = BuildNotificationData(req);

        await messagePublisher.PublishAsync(
            RabbitMQQueues.CreateBulkUserNotification,
            new CreateBulkUserNotificationMessage(
                UserIds: targetUserIds,
                NotificationType: req.NotificationType,
                StatusType: req.StatusType,
                Priority: req.Priority,
                Title: req.Title,
                Message: req.Message,
                ActionUrl: req.ActionUrl,
                ActionLabel: req.ActionUrl != null ? "Ver detalhes" : null,
                SendInApp: req.SendInApp,
                SendPush: req.SendPush,
                PushData: data
            ));

        var message = targetUserIds.Count == 1
            ? "Notificação enviada para processamento!"
            : $"{targetUserIds.Count} notificações enviadas para processamento!";

        await SendSuccessAsync(targetUserIds.Count, false, null, message, ct);
    }

    private static Dictionary<string, string> BuildNotificationData(SendNotificationRequest req)
    {
        var data = new Dictionary<string, string>
        {
            { "notificationId", Guid.CreateVersion7().ToString() },
            { "priority", req.Priority.ToString() },
            { "notificationType", req.NotificationType.ToString() },
            { "scope", "user" }
        };

        if (!string.IsNullOrEmpty(req.ActionUrl))
        {
            data["actionUrl"] = req.ActionUrl;
            data["actionLabel"] = "Ver detalhes";
        }

        if (req.StatusType.HasValue)
        {
            data["statusType"] = req.StatusType.Value.ToString();
        }

        return data;
    }

    private Task SendUnauthorizedAsync(CancellationToken ct)
    {
        return Send.ResponseAsync(new SendNotificationResponse
        {
            Error = new("Token inválido.")
        }, 401, ct);
    }

    private Task SendForbiddenAsync(string message, CancellationToken ct)
    {
        return Send.ResponseAsync(new SendNotificationResponse
        {
            Error = new(message)
        }, 403, ct);
    }

    private Task SendNotFoundAsync(string message, CancellationToken ct)
    {
        return Send.ResponseAsync(new SendNotificationResponse
        {
            Error = new(message)
        }, 404, ct);
    }

    private Task SendErrorAsync(string message, int statusCode, CancellationToken ct)
    {
        return Send.ResponseAsync(new SendNotificationResponse
        {
            Error = new(message)
        }, statusCode, ct);
    }

    private Task SendSuccessAsync(int total, bool isBatch, string? batchInfo, string? message, CancellationToken ct)
    {
        return Send.OkAsync(new SendNotificationResponse
        {
            Data = new SendNotificationData
            {
                TotalTargets = total,
                IsBatchProcessing = isBatch,
                BatchInfo = batchInfo
            },
            Message = message ?? $"Notificação sendo enviada para {total} usuário(s) via fila."
        }, ct);
    }
}
