using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Interfaces;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;

namespace swiftpay_api.Endpoints.Files.DeleteFile;

public sealed class DeleteFileEndpoint(
    IStorageService storageService,
    ISecurityLogService securityLog,
    PrimaryDbContext dbContext
) : Endpoint<DeleteFileRequest, DeleteFileResponse>
{
    public override void Configure()
    {
        Delete("{id:guid}");
        Group<FileGroup>();
    }

    public override async Task HandleAsync(DeleteFileRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new DeleteFileResponse
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
            await Send.ResponseAsync(new DeleteFileResponse
            {
                Error = new("Arquivo não encontrado.")
            }, 404, ct);
            return;
        }

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
            await Send.ResponseAsync(new DeleteFileResponse
            {
                Error = new("Você não tem permissão para excluir este arquivo.")
            }, 403, ct);
            return;
        }

        try
        {
            await storageService.DeleteFileAsync(storedFile.ObjectName);

            dbContext.StoredFiles.Remove(storedFile);
            await dbContext.SaveChangesAsync(ct);

            await securityLog.LogAsync(new SecurityLogInput
            {
                Action = SecurityLogAction.FileDeleted,
                Status = SecurityLogStatus.Success,
                UserId = userId,
                Details = $"File deleted: {storedFile.OriginalFileName}, FileId: {storedFile.Id}"
            });

            await Send.OkAsync(new DeleteFileResponse
            {
                Message = "Arquivo excluído com sucesso."
            }, ct);
        }
        catch (Exception ex)
        {
            await securityLog.LogAsync(new SecurityLogInput
            {
                Action = SecurityLogAction.FileDeleted,
                Status = SecurityLogStatus.Failed,
                UserId = userId,
                Details = $"File deletion failed: {storedFile.OriginalFileName}, FileId: {storedFile.Id}. Error: {ex.Message}"
            });

            await Send.ResponseAsync(new DeleteFileResponse
            {
                Error = new("Erro ao excluir o arquivo. Tente novamente.")
            }, 500, ct);
        }
    }
}
