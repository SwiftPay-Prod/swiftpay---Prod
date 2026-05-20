using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Interfaces;

public interface IStorageService
{
    Task<UploadResult> UploadFileAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        UploadFolder folder,
        Guid ownerId,
        Guid uploaderId,
        bool isPublic = false);

    Task DeleteFileAsync(string objectName);
    Task<bool> FileExistsAsync(string objectName);
    Task<string> GetPresignedUrlAsync(string objectName, int expiryInSeconds = 3600);
    string GetPublicUrl(string objectName);

    Task<string> GetOrRefreshUrlAsync(StoredFile file, int expiryInSeconds = 43200);
}

public class UploadResult
{
    public required string Url { get; set; }
    public required string ObjectName { get; set; }
    public required string OriginalFileName { get; set; }
    public required string ContentType { get; set; }
    public required long Size { get; set; }
    public required bool IsPublic { get; set; }
    public required UploadFolder Folder { get; set; }
    public required Guid OwnerId { get; set; }
    public required Guid UploaderId { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class FileMetadata
{
    public required string ObjectName { get; set; }
    public required string OriginalFileName { get; set; }
    public required string ContentType { get; set; }
    public required long Size { get; set; }
    public required bool IsPublic { get; set; }
    public required Guid OwnerId { get; set; }
    public required Guid UploaderId { get; set; }
    public required UploadFolder Folder { get; set; }
}

public class FileAccessResult
{
    public required string Url { get; set; }
    public required bool IsPublic { get; set; }
    public required int? ExpiresInSeconds { get; set; }
    public required FileMetadata Metadata { get; set; }
}
