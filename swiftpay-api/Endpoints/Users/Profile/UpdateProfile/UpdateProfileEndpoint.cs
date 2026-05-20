using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Users.Profile.UpdateProfile;

public sealed class UpdateProfileEndpoint(PrimaryDbContext dbContext)
    : Endpoint<UpdateProfileRequest, UpdateProfileResponse>
{
    public override void Configure()
    {
        Patch("profile");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(UpdateProfileRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpdateProfileResponse { Error = new("Token inválido.") }, 401, ct);
            return;
        }

        var user = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null)
        {
            await Send.ResponseAsync(new UpdateProfileResponse { Error = new("Usuário não encontrado.") }, 404, ct);
            return;
        }

        if (req.Name != null) user.Name = req.Name.Trim();
        if (req.Bio != null) user.Bio = string.IsNullOrWhiteSpace(req.Bio) ? null : req.Bio.Trim();
        if (req.SocialLinks != null) user.SocialLinks = string.IsNullOrWhiteSpace(req.SocialLinks) ? null : req.SocialLinks;

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new UpdateProfileResponse
        {
            Data = new UpdateProfileData
            {
                Name = user.Name,
                Bio = user.Bio,
                SocialLinks = user.SocialLinks
            },
            Message = "Perfil atualizado com sucesso!"
        }, ct);
    }
}
