using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Notifications.BroadcastNotification;

public sealed class BroadcastPreviewRequest
{
    public string Audience { get; set; } = null!;
    public Guid? MerchantId { get; set; }
    public string? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string Title { get; set; } = null!;
    public string Body { get; set; } = null!;
    public string? ActionUrl { get; set; }
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public sealed class BroadcastPreviewResponse : BaseResponse<BroadcastPreviewData>;

public sealed class BroadcastPreviewData
{
    public bool Accepted { get; set; }
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public List<BroadcastPreviewUserItem> Items { get; set; } = new();
}

public sealed class BroadcastPreviewUserItem
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool PushEnabled { get; set; }
    public bool InfoEnabled { get; set; }
}

public sealed class BroadcastPreviewEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<BroadcastPreviewRequest, BroadcastPreviewResponse>
{
    public override void Configure()
    {
        Post("broadcast/preview");
        Group<AdminGroup>();
        Roles(nameof(UserRole.God));
    }

    public override async Task HandleAsync(BroadcastPreviewRequest req, CancellationToken ct)
    {
        var actorId = EndpointUtils.GetUserId(User);
        if (actorId == null)
        {
            await Send.ResponseAsync(new BroadcastPreviewResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var audience = (req.Audience ?? string.Empty).Trim().ToLowerInvariant();
        if (audience != "all" && audience != "merchant" && audience != "user")
        {
            await Send.ResponseAsync(new BroadcastPreviewResponse
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
                await Send.ResponseAsync(new BroadcastPreviewResponse
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
                    await Send.ResponseAsync(new BroadcastPreviewResponse
                    {
                        Error = new("UserId inválido.")
                    }, 400, ct);
                    return;
                }

                query = query.Where(u => u.Id == parsedUserId);
            }
            else
            {
                await Send.ResponseAsync(new BroadcastPreviewResponse
                {
                    Error = new("Informe UserId ou UserEmail para audiência user.")
                }, 400, ct);
                return;
            }
        }

        var total = await query.CountAsync(ct);
        var page = req.Page < 1 ? 1 : req.Page;
        var pageSize = req.PageSize is < 1 or > 100 ? 20 : req.PageSize;

        var items = await query
            .OrderBy(u => u.Email)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new BroadcastPreviewUserItem
            {
                Id = u.Id,
                Name = u.Name ?? string.Empty,
                Email = u.Email,
                PushEnabled = !dbContext.UserNotificationPreferences
                    .Where(p => p.UserId == u.Id)
                    .Select(p => p.PushNotificationsEnabled)
                    .FirstOrDefault(),
                InfoEnabled = !dbContext.UserNotificationPreferences
                    .Where(p => p.UserId == u.Id)
                    .Select(p => p.NotifyInfo)
                    .FirstOrDefault()
            })
            .ToListAsync(ct);

        await Send.OkAsync(new BroadcastPreviewResponse
        {
            Data = new BroadcastPreviewData
            {
                Accepted = true,
                Total = total,
                Page = page,
                PageSize = pageSize,
                Items = items
            }
        }, ct);
    }
}
