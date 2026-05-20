using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using safefy_api.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api.Models.Settings;

namespace safefy_api.Services.Internal;

public class StorageService : IStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly StorageSettingsOptions _settings;
    private readonly ILogger<StorageService> _logger;
    private readonly string _serviceUrl;

    public StorageService(
        IOptions<StorageSettingsOptions> storageSettings,
        ILogger<StorageService> logger)
    {
        _settings = storageSettings.Value;
        _logger = logger;

        var protocol = _settings.UseSSL ? "https" : "http";
        _serviceUrl = _settings.Endpoint.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || _settings.Endpoint.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
            ? _settings.Endpoint
            : $"{protocol}://{_settings.Endpoint}";

        var credentials = new BasicAWSCredentials(_settings.AccessKey, _settings.SecretKey);
        var config = new AmazonS3Config
        {
            ServiceURL = _serviceUrl,
            ForcePathStyle = true,
            AuthenticationRegion = "us-east-1",
            SignatureVersion = "4"
        };

        _s3Client = new AmazonS3Client(credentials, config);
    }

    public async Task<UploadResult> UploadFileAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        UploadFolder folder,
        Guid ownerId,
        Guid uploaderId,
        bool isPublic = false)
    {
        try
        {
            var extension = Path.GetExtension(fileName);
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var visibility = isPublic ? "public" : "private";
            var folderPath = $"{visibility}/{folder.ToString().ToLowerInvariant()}/{ownerId}";
            var objectName = $"{folderPath}/{uniqueFileName}";

            var putRequest = new PutObjectRequest
            {
                BucketName = _settings.BucketName,
                Key = objectName,
                InputStream = fileStream,
                ContentType = contentType,
                AutoCloseStream = false,
                CannedACL = isPublic ? S3CannedACL.PublicRead : S3CannedACL.Private
            };

            await _s3Client.PutObjectAsync(putRequest);

            string url;
            DateTime? expiresAt = null;
            if (isPublic)
            {
                url = GetPublicUrl(objectName);
            }
            else
            {
                url = await GetPresignedUrlAsync(objectName, 43200);
                expiresAt = DateTime.UtcNow.AddSeconds(43200);
            }

            return new UploadResult
            {
                Url = url,
                ObjectName = objectName,
                OriginalFileName = fileName,
                ContentType = contentType,
                Size = fileStream.Length,
                IsPublic = isPublic,
                Folder = folder,
                OwnerId = ownerId,
                UploaderId = uploaderId,
                ExpiresAt = expiresAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload file: {FileName}", fileName);
            throw;
        }
    }

    public async Task DeleteFileAsync(string objectName)
    {
        try
        {
            await _s3Client.DeleteObjectAsync(_settings.BucketName, objectName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete file: {ObjectName}", objectName);
            throw;
        }
    }

    public async Task<bool> FileExistsAsync(string objectName)
    {
        try
        {
            await _s3Client.GetObjectMetadataAsync(_settings.BucketName, objectName);
            return true;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check file existence: {ObjectName}", objectName);
            throw;
        }
    }

    public async Task<string> GetPresignedUrlAsync(string objectName, int expiryInSeconds = 3600)
    {
        try
        {
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _settings.BucketName,
                Key = objectName,
                Verb = HttpVerb.GET,
                Expires = DateTime.UtcNow.AddSeconds(expiryInSeconds)
            };

            var presignedUrl = await _s3Client.GetPreSignedURLAsync(request);

            if (!string.IsNullOrEmpty(_settings.PublicUrl))
            {
                var directBase = $"{_serviceUrl.TrimEnd('/')}/{_settings.BucketName}/";
                var cdnBase = $"{_settings.PublicUrl.TrimEnd('/')}/";

                if (presignedUrl.StartsWith(directBase, StringComparison.OrdinalIgnoreCase))
                {
                    presignedUrl = cdnBase + presignedUrl[directBase.Length..];
                }
            }

            return presignedUrl;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate presigned URL: {ObjectName}", objectName);
            throw;
        }
    }

    public string GetPublicUrl(string objectName)
    {
        if (!string.IsNullOrEmpty(_settings.PublicUrl))
        {
            return $"{_settings.PublicUrl.TrimEnd('/')}/{objectName}";
        }

        var protocol = _settings.UseSSL ? "https" : "http";
        return $"{protocol}://{_settings.Endpoint}/{_settings.BucketName}/{objectName}";
    }

    public async Task<string> GetOrRefreshUrlAsync(StoredFile file, int expiryInSeconds = 43200)
    {
        var expectedBase = !string.IsNullOrEmpty(_settings.PublicUrl)
            ? _settings.PublicUrl.TrimEnd('/')
            : null;

        if (file.IsPublic)
        {
            var needsPublicRefresh = string.IsNullOrEmpty(file.CachedUrl)
                || (expectedBase != null && !file.CachedUrl.StartsWith(expectedBase, StringComparison.OrdinalIgnoreCase));

            if (needsPublicRefresh)
            {
                file.CachedUrl = GetPublicUrl(file.ObjectName);
                file.CachedUrlExpiresAt = null;
            }

            return file.CachedUrl!;
        }

        var isCdnMismatch = expectedBase != null
            && !string.IsNullOrEmpty(file.CachedUrl)
            && !file.CachedUrl.StartsWith(expectedBase, StringComparison.OrdinalIgnoreCase);

        var requiredExpiryAt = DateTime.UtcNow.AddSeconds(expiryInSeconds);
        var hasInsufficientCachedTtl = file.CachedUrlExpiresAt.HasValue
            && file.CachedUrlExpiresAt.Value < requiredExpiryAt;

        if (!file.IsUrlExpired() && !isCdnMismatch && !hasInsufficientCachedTtl)
        {
            return file.CachedUrl!;
        }

        file.CachedUrl = await GetPresignedUrlAsync(file.ObjectName, expiryInSeconds);
        file.CachedUrlExpiresAt = DateTime.UtcNow.AddSeconds(expiryInSeconds);

        return file.CachedUrl;
    }
}
