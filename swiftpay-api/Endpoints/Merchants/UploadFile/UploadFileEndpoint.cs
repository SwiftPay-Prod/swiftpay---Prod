using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Utils;
using safefy_api.EndpointsGroups;
using safefy_api.Endpoints.Models;
using safefy_api.Interfaces;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Inputs;

namespace safefy_api.Endpoints.Merchants.UploadFile;

public sealed class UploadFileEndpoint(
    IStorageService storageService,
    ISecurityLogService securityLog,
    PrimaryDbContext dbContext
) : Endpoint<UploadFileRequest, UploadFileResponse>
{
    public override void Configure()
    {
        Post("upload");
        Group<MerchantGroup>();
        AllowFileUploads();
    }

    public override async Task HandleAsync(UploadFileRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UploadFileResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        // Valida se o merchant existe e pertence ao usuário
        var merchant = await dbContext.Merchants
            .AsNoTracking()
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new UploadFileResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        try
        {
            using var stream = req.File.OpenReadStream();

            var result = await storageService.UploadFileAsync(
                stream,
                req.File.FileName,
                req.File.ContentType,
                req.Folder,
                ownerId: req.MerchantId,
                uploaderId: userId.Value,
                isPublic: req.IsPublic
            );

            var storedFile = new StoredFile
            {
                ObjectName = result.ObjectName,
                OriginalFileName = result.OriginalFileName,
                ContentType = result.ContentType,
                Size = result.Size,
                IsPublic = result.IsPublic,
                Folder = result.Folder,
                OwnerId = result.OwnerId,
                UploaderId = result.UploaderId
            };

            dbContext.StoredFiles.Add(storedFile);
            await dbContext.SaveChangesAsync(ct);

            await securityLog.LogAsync(new SecurityLogInput
            {
                Action = SecurityLogAction.FileUploaded,
                Status = SecurityLogStatus.Success,
                UserId = userId,
                Details = $"File uploaded: {result.OriginalFileName}, Size: {req.File.Length} bytes, FileId: {storedFile.Id}, IsPublic: {req.IsPublic}"
            });

            await Send.ResponseAsync(new UploadFileResponse
            {
                Data = new FileData
                {
                    Id = storedFile.Id,
                    Url = result.Url,
                    OriginalFileName = result.OriginalFileName,
                    Size = result.Size,
                    ContentType = result.ContentType,
                    ExpiresAt = result.ExpiresAt
                }
            }, cancellation: ct);
        }
        catch (Exception ex)
        {
            await securityLog.LogAsync(new SecurityLogInput
            {
                Action = SecurityLogAction.FileUploaded,
                Status = SecurityLogStatus.Failed,
                UserId = userId,
                Details = $"File upload failed: {req.File.FileName}. Error: {ex.Message}"
            });

            await Send.ResponseAsync(new UploadFileResponse
            {
                Error = new("Erro ao fazer upload do arquivo. Tente novamente.")
            }, 500, ct);
        }
    }
}
