using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Users.Profile.UploadAvatar;

public sealed class UploadAvatarEndpoint(
    IStorageService storageService,
    PrimaryDbContext dbContext
) : Endpoint<UploadAvatarRequest, UploadAvatarResponse>
{
    public override void Configure()
    {
        Post("profile/avatar");
        Group<UserGroup>();
        AllowFileUploads();
    }

    public override async Task HandleAsync(UploadAvatarRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UploadAvatarResponse { Error = new("Token inválido.") }, 401, ct);
            return;
        }

        var user = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null)
        {
            await Send.ResponseAsync(new UploadAvatarResponse { Error = new("Usuário não encontrado.") }, 404, ct);
            return;
        }

        try
        {
            // Delete old avatar if exists
            if (user.ProfileImageId.HasValue)
            {
                var oldFile = await dbContext.StoredFiles
                    .OrderBy(f => f.Id)
                    .FirstOrDefaultAsync(f => f.Id == user.ProfileImageId.Value, ct);

                if (oldFile != null)
                {
                    await storageService.DeleteFileAsync(oldFile.ObjectName);
                    dbContext.StoredFiles.Remove(oldFile);
                }
            }

            using var stream = req.File.OpenReadStream();

            var result = await storageService.UploadFileAsync(
                stream,
                req.File.FileName,
                req.File.ContentType,
                UploadFolder.Avatars,
                ownerId: userId.Value,
                uploaderId: userId.Value,
                isPublic: true
            );

            var storedFile = new StoredFile
            {
                ObjectName = result.ObjectName,
                OriginalFileName = result.OriginalFileName,
                ContentType = result.ContentType,
                Size = result.Size,
                IsPublic = true,
                Folder = UploadFolder.Avatars,
                OwnerId = userId.Value,
                UploaderId = userId.Value,
                CachedUrl = result.Url,
                CachedUrlExpiresAt = null
            };

            dbContext.StoredFiles.Add(storedFile);

            user.ProfileImageId = storedFile.Id;
            user.ProfileImageUrl = result.Url;

            await dbContext.SaveChangesAsync(ct);

            await Send.ResponseAsync(new UploadAvatarResponse
            {
                Data = new UploadAvatarData
                {
                    FileId = storedFile.Id,
                    Url = result.Url
                },
                Message = "Foto de perfil atualizada com sucesso!"
            }, 200, ct);
        }
        catch (Exception ex)
        {
            await Send.ResponseAsync(new UploadAvatarResponse
            {
                Error = new("Erro ao fazer upload da foto. Tente novamente.")
            }, 500, ct);
            _ = ex;
        }
    }
}
