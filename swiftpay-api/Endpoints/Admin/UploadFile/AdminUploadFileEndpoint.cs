using FastEndpoints;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Interfaces;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Constants;

namespace swiftpay_api.Endpoints.Admin.UploadFile;

public sealed class AdminUploadFileEndpoint(
    IStorageService storageService,
    ISecurityLogService securityLog,
    PrimaryDbContext dbContext
) : Endpoint<AdminUploadFileRequest, AdminUploadFileResponse>
{
    public override void Configure()
    {
        Post("upload");
        Group<AdminGroup>();
        AllowFileUploads();
    }

    public override async Task HandleAsync(AdminUploadFileRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new AdminUploadFileResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
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
                ownerId: SystemIds.PlatformOwner,
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
                Details = $"Admin file uploaded: {result.OriginalFileName}, Size: {req.File.Length} bytes, FileId: {storedFile.Id}, IsPublic: {req.IsPublic}"
            });

            await Send.ResponseAsync(new AdminUploadFileResponse
            {
                Data = new Models.FileData
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
                Details = $"Admin file upload failed: {req.File.FileName}. Error: {ex.Message}"
            });

            await Send.ResponseAsync(new AdminUploadFileResponse
            {
                Error = new("Erro ao fazer upload do arquivo. Tente novamente.")
            }, 500, ct);
        }
    }
}
