namespace swiftpay_api.Models.Settings;

public class StorageSettingsOptions
{
    public const string StorageSettings = "StorageSettings";

    public required string Endpoint { get; set; }
    public required string AccessKey { get; set; }
    public required string SecretKey { get; set; }
    public required string BucketName { get; set; }
    public bool UseSSL { get; set; } = true;
    public string? PublicUrl { get; set; }
}
