using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Users.Bulletins.ReadUnreadBulletins;

public sealed class ReadUnreadBulletinsEndpoint(
    PrimaryDbContext dbContext
) : EndpointWithoutRequest<ReadUnreadBulletinsResponse>
{
    public override void Configure()
    {
        Get("bulletins/unread");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadUnreadBulletinsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var now = DateTime.UtcNow;

        var unreadBulletins = await dbContext.Bulletins
            .Where(b => b.ExpiresAt > now)
            .Where(b => !dbContext.BulletinReads.Any(br => br.BulletinId == b.Id && br.UserId == userId.Value))
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new UnreadBulletinData
            {
                Id = b.Id,
                Title = b.Title,
                Content = b.Content,
                CreatedAt = b.CreatedAt
            })
            .ToListAsync(ct);

        await Send.OkAsync(new ReadUnreadBulletinsResponse
        {
            Data = unreadBulletins
        }, ct);
    }
}
