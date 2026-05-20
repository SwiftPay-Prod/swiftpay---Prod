using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Utils;
using safefy_api.EndpointsGroups;
using safefy_api.Endpoints.Models;
using safefy_api.Interfaces;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Files.GetFile;

public sealed class GetFileEndpoint(
    IStorageService storageService,
    PrimaryDbContext dbContext
) : Endpoint<GetFileRequest, GetFileResponse>
{
    public override void Configure()
    {
        Get("{id:guid}");
        Group<FileGroup>();
    }

    public override async Task HandleAsync(GetFileRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new GetFileResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var storedFile = await dbContext.StoredFiles
            .OrderBy(f => f.Id)
            .FirstOrDefaultAsync(f => f.Id == req.Id, ct);

        if (storedFile == null)
        {
            await Send.ResponseAsync(new GetFileResponse
            {
                Error = new("Arquivo não encontrado.")
            }, 404, ct);
            return;
        }

        if (!storedFile.IsPublic)
        {
            var userRole = EndpointUtils.GetUserRole(User);
            var isAdmin = userRole == nameof(UserRole.Admin) || userRole == nameof(UserRole.God);
            var isUploader = storedFile.UploaderId == userId;

            var isOwner = false;
            if (storedFile.OwnerId != Guid.Empty)
            {
                isOwner = await dbContext.Merchants
                    .AsNoTracking()
                    .AnyAsync(m => m.Id == storedFile.OwnerId && m.UserId == userId, ct);
            }

            if (!isAdmin && !isUploader && !isOwner)
            {
                await Send.ResponseAsync(new GetFileResponse
                {
                    Error = new("Você não tem permissão para acessar este arquivo.")
                }, 403, ct);
                return;
            }
        }

        var url = await storageService.GetOrRefreshUrlAsync(storedFile);
        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new GetFileResponse
        {
            Data = new FileData
            {
                Id = storedFile.Id,
                Url = url,
                ExpiresAt = storedFile.CachedUrlExpiresAt,
                OriginalFileName = storedFile.OriginalFileName,
                ContentType = storedFile.ContentType,
                Size = storedFile.Size
            }
        }, ct);
    }
}
