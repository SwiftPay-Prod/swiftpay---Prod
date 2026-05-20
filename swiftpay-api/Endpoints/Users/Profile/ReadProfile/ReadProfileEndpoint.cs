using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Users.Profile.ReadProfile;

public sealed class ReadProfileEndpoint(PrimaryDbContext dbContext) : EndpointWithoutRequest<ReadProfileResponse>
{
    public override void Configure()
    {
        Get("profile");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadProfileResponse { Error = new("Token inválido.") }, 401, ct);
            return;
        }

        var user = await dbContext.Users
            .AsNoTracking()
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null)
        {
            await Send.ResponseAsync(new ReadProfileResponse { Error = new("Usuário não encontrado.") }, 404, ct);
            return;
        }

        await Send.OkAsync(new ReadProfileResponse
        {
            Data = new ProfileData
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Bio = user.Bio,
                SocialLinks = user.SocialLinks,
                ProfileImageUrl = user.ProfileImageUrl,
                ProfileImageId = user.ProfileImageId
            }
        }, ct);
    }
}
