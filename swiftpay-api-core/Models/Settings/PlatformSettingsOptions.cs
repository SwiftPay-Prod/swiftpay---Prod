namespace swiftpay_api_core.Models.Settings;

public class PlatformSettingsOptions
{
    public const string PlatformSettings = "PlatformSettings";

    public required string BaseUrl { get; set; }
    public required string CheckoutBaseUrl { get; set; }
    public string ApiVersion { get; set; } = "v1";
    public int MaxLoginAttempts { get; set; } = 5;
    public int VerificationCodeExpirationMinutes { get; set; } = 15;
}
