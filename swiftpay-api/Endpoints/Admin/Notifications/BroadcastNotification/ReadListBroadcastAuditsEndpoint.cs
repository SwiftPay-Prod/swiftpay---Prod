using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Notifications.BroadcastNotification;

public sealed class ReadListBroadcastAuditsRequest
{
    public Guid? MerchantId { get; set; }
    public string? Audience { get; set; }
    public string? UserEmail { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
}

public sealed class ReadListBroadcastAuditsResponse : BaseResponse<Paginated<BroadcastAuditItem>>;

public sealed class BroadcastAuditItem
{
    public Guid Id { get; set; }
    public Guid ActorUserId { get; set; }
    public string Audience { get; set; } = string.Empty;
    public Guid? MerchantId { get; set; }
    public string? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? ActionUrl { get; set; }
    public string Priority { get; set; } = string.Empty;
    public int Total { get; set; }
    public int Processed { get; set; }
    public int Success { get; set; }
    public int Failure { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class ReadListBroadcastAuditsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListBroadcastAuditsRequest, ReadListBroadcastAuditsResponse>
{
    public override void Configure()
    {
        Get("broadcast/audits");
        Group<AdminGroup>();
        Roles(nameof(UserRole.God));
    }

    public override async Task HandleAsync(ReadListBroadcastAuditsRequest req, CancellationToken ct)
    {
        var query = dbContext.BroadcastAudits.AsNoTracking();

        if (req.MerchantId.HasValue)
        {
            query = query.Where(a => a.MerchantId == req.MerchantId.Value);
        }

        if (!string.IsNullOrWhiteSpace(req.Audience))
        {
            var audience = req.Audience.Trim().ToLowerInvariant();
            query = query.Where(a => a.Audience == audience);
        }

        if (!string.IsNullOrWhiteSpace(req.UserEmail))
        {
            query = query.Where(a => a.UserEmail == req.UserEmail.Trim());
        }

        var total = await query.CountAsync(ct);
        var page = req.Page < 1 ? 1 : req.Page;
        var pageSize = req.PageSize is < 1 or > 100 ? 25 : req.PageSize;

        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new BroadcastAuditItem
            {
                Id = a.Id,
                ActorUserId = a.ActorUserId,
                Audience = a.Audience,
                MerchantId = a.MerchantId,
                UserId = a.UserId,
                UserEmail = a.UserEmail,
                Title = a.Title,
                Body = a.Body,
                ActionUrl = a.ActionUrl,
                Priority = a.Priority,
                Total = a.Total,
                Processed = a.Processed,
                Success = a.Success,
                Failure = a.Failure,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync(ct);

        await Send.OkAsync(new ReadListBroadcastAuditsResponse
        {
            Data = new Paginated<BroadcastAuditItem>
            {
                Items = items,
                TotalItems = total,
                Page = page,
                PageSize = pageSize
            }
        }, ct);
    }
}
