namespace safefy_api_core.Models.Settings;

public class FirebaseSettings
{
    public const string SectionName = "FirebaseSettings";
    
    public string ProjectId { get; set; } = string.Empty;
    public string PrivateKeyId { get; set; } = string.Empty;
    public string PrivateKey { get; set; } = string.Empty;
    public string ClientEmail { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public bool Enabled { get; set; } = true;
}
