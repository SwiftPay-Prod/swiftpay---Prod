using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Services;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Admin.Notifications.BroadcastNotification;

public sealed class BroadcastNotificationEndpoint(
    PrimaryDbContext dbContext,
    INotificationService notificationService
) : Endpoint<BroadcastNotificationRequest, BroadcastNotificationResponse>
{
    public override void Configure()
    {
        Post("broadcast");
        Group<AdminGroup>();
        Roles(nameof(UserRole.God));
    }

    public override async Task HandleAsync(BroadcastNotificationRequest req, CancellationToken ct)
    {
        var actorId = EndpointUtils.GetUserId(User);
        if (actorId == null)
        {
            await Send.ResponseAsync(new BroadcastNotificationResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var audience = (req.Audience ?? string.Empty).Trim().ToLowerInvariant();
        if (audience != "all" && audience != "merchant" && audience != "user")
        {
            await Send.ResponseAsync(new BroadcastNotificationResponse
            {
                Error = new("Audiência inválida. Use: all | merchant | user")
            }, 400, ct);
            return;
        }

        var query = dbContext.Users.AsNoTracking();

        if (audience == "merchant")
        {
            if (!req.MerchantId.HasValue)
            {
                await Send.ResponseAsync(new BroadcastNotificationResponse
                {
                    Error = new("Informe MerchantId para audiência merchant.")
                }, 400, ct);
                return;
            }

            query = query.Where(u => u.Merchants.Any(m => m.Id == req.MerchantId.Value));
        }
        else if (audience == "user")
        {
            if (!string.IsNullOrWhiteSpace(req.UserEmail))
            {
                query = query.Where(u => u.Email == req.UserEmail.Trim());
            }
            else if (!string.IsNullOrWhiteSpace(req.UserId))
            {
                if (!Guid.TryParse(req.UserId, out Guid parsedUserId))
                {
                    await Send.ResponseAsync(new BroadcastNotificationResponse
                    {
                        Error = new("UserId inválido.")
                    }, 400, ct);
                    return;
                }

                query = query.Where(u => u.Id == parsedUserId);
            }
            else
            {
                await Send.ResponseAsync(new BroadcastNotificationResponse
                {
                    Error = new("Informe UserId ou UserEmail para audiência user.")
                }, 400, ct);
                return;
            }
        }

        var total = await query.CountAsync(ct);
        if (total == 0)
        {
            await Send.OkAsync(new BroadcastNotificationResponse
            {
                Data = new BroadcastNotificationData { Accepted = false, Total = 0 }
            }, ct);
            return;
        }

        var actorIdValue = actorId.Value;
        var title = req.Title;
        var body = req.Body;
        var actionUrl = req.ActionUrl;
        var priority = req.Priority;
        var audienceValue = audience;
        var merchantId = req.MerchantId;
        var targetUserId = req.UserId;
        var userEmail = req.UserEmail;

        const int BatchSize = 500;
        var processed = 0;
        var success = 0;
        var failure = 0;

        _ = Task.Run(async () =>
        {
            for (var skip = 0; skip < total; skip += BatchSize)
            {
                var batch = await query
                    .Skip(skip)
                    .Take(BatchSize)
                    .ToListAsync(ct);

                foreach (var user in batch)
                {
                    try
                    {
                        var prefs = await dbContext.UserNotificationPreferences
                            .AsNoTracking()
                            .FirstOrDefaultAsync(p => p.UserId == user.Id, ct);

                        var pushEnabled = prefs == null || prefs.PushNotificationsEnabled;
                        var infoEnabled = prefs == null || prefs.NotifyInfo;

                        if (pushEnabled && infoEnabled)
                        {
                            await notificationService.CreateWithTemplateAsync(
                                merchantId: Guid.Empty,
                                type: NotificationType.Info,
                                title: title,
                                message: body,
                                priority: priority,
                                actionUrl: actionUrl,
                                requiresMerchantRefresh: false,
                                environment: ApiEnvironment.Production,
                                templateData: null);
                        }

                        success++;
                    }
                    catch
                    {
                        failure++;
                    }

                    processed++;
                }
            }

            var audit = new BroadcastAudit
            {
                Id = Guid.CreateVersion7(),
                ActorUserId = actorIdValue,
                Audience = audienceValue,
                MerchantId = merchantId,
                UserId = string.IsNullOrWhiteSpace(targetUserId) ? null : targetUserId,
                UserEmail = string.IsNullOrWhiteSpace(userEmail) ? null : userEmail,
                Title = title,
                Body = body,
                ActionUrl = actionUrl,
                Priority = priority.ToString(),
                Total = total,
                Processed = processed,
                Success = success,
                Failure = failure,
                CreatedAt = DateTime.UtcNow
            };

            dbContext.BroadcastAudits.Add(audit);
            await dbContext.SaveChangesAsync(ct);
        }, ct);

        await Send.OkAsync(new BroadcastNotificationResponse
        {
            Data = new BroadcastNotificationData { Accepted = true, Total = total }
        }, ct);
    }
}
