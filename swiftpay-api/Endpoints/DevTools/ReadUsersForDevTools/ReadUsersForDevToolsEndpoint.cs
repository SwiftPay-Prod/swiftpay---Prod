using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.DevTools.ReadUsersForDevTools;

public sealed class ReadUsersForDevToolsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadUsersForDevToolsRequest, ReadUsersForDevToolsResponse>
{
    public override void Configure()
    {
        Get("users");
        Group<DevToolsGroup>();
    }

    public override async Task HandleAsync(ReadUsersForDevToolsRequest req, CancellationToken ct)
    {
        var query = dbContext.Users
            .Where(u => u.Status == UserStatus.Active && u.EmailVerified);

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var search = req.Search.ToLower();
            query = query.Where(u => 
                (u.Name != null && u.Name.ToLower().Contains(search)) ||
                u.Email.ToLower().Contains(search));
        }

        var users = await query
            .OrderBy(u => u.Name)
            .Select(u => new DevToolsUserData
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                HasPushEnabled = dbContext.PushTokens.Any(pt => pt.UserId == u.Id && pt.IsActive)
            })
            .ToListAsync(ct);

        await Send.OkAsync(new ReadUsersForDevToolsResponse
        {
            Data = new(users)
        }, ct);
    }
}
