using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;
using safefy_api.Mappers;

namespace safefy_api.Endpoints.Users.ReadUser;

public sealed class ReadUserEndpoint(PrimaryDbContext dbContext) : EndpointWithoutRequest<ReadUserResponse>
{
    public override void Configure()
    {
        Get("");
        Group<UserGroup>();
        Roles(nameof(UserRole.God), nameof(UserRole.Admin));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        
        var user = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null)
        {
            await Send.ResponseAsync(new ReadUserResponse
            {
                Error = new("Usuário não encontrado.")
            }, 404, ct);
            return;
        }

        await Send.OkAsync(new ReadUserResponse
        {
            Data = UserMapper.ToUserDetails(user)
        }, ct);
    }
}
