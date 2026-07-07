namespace swiftpay_api_core.Models.Settings;

public class JWTSettingsOptions
{
    public const string JWTSettings = "JWTSettings";

    public required string Secret { get; set; }
    public required string Issuer { get; set; }
    public required string Audience { get; set; }
    public int TokenExpiryDays { get; set; } = 7;
    public int TokenExpireMinutes { get; set; } = 60;
    public int TokenExpireSeconds { get; set; } = 3600;
    public int SlidingRenewalThresholdHours { get; set; } = 24;
}
