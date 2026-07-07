namespace swiftpay_api_payment.Models.Settings;

public class BankiziSettingsOptions
{
    public const string BankiziSettings = "BankiziSettings";
    public required string BaseUrl { get; set; }
    public required string ClientId { get; set; }
    public required string ClientSecret { get; set; }
    public int PixExpirationMinutes { get; set; } = 30;
    public int TokenRefreshBufferSeconds { get; set; } = 300;
}
