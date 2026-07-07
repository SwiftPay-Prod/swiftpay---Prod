using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api.Interfaces;

namespace swiftpay_api.Endpoints.Users.Profile.DeleteAvatar;

public sealed class DeleteAvatarEndpoint(
    IStorageService storageService,
    PrimaryDbContext dbContext
) : EndpointWithoutRequest<DeleteAvatarResponse>
{
    public override void Configure()
    {
        Delete("profile/avatar");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new DeleteAvatarResponse { Error = new("Token inválido.") }, 401, ct);
            return;
        }

        var user = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null)
        {
            await Send.ResponseAsync(new DeleteAvatarResponse { Error = new("Usuário não encontrado.") }, 404, ct);
            return;
        }

        if (!user.ProfileImageId.HasValue)
        {
            await Send.ResponseAsync(new DeleteAvatarResponse { Error = new("Nenhuma foto de perfil cadastrada.") }, 400, ct);
            return;
        }

        var file = await dbContext.StoredFiles
            .OrderBy(f => f.Id)
            .FirstOrDefaultAsync(f => f.Id == user.ProfileImageId.Value, ct);

        if (file != null)
        {
            await storageService.DeleteFileAsync(file.ObjectName);
            dbContext.StoredFiles.Remove(file);
        }

        user.ProfileImageId = null;
        user.ProfileImageUrl = null;

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new DeleteAvatarResponse
        {
            Message = "Foto de perfil removida com sucesso!"
        }, ct);
    }
}
