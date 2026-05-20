namespace safefy_api.Models.Settings;

public class PaymentApiSettings
{
    public const string PaymentApi = "PaymentApi";
    
    public string BaseUrl { get; set; } = "http://localhost:5002/";
    public string InternalApiKey { get; set; } = string.Empty;
    public int TimeoutSeconds { get; set; } = 30;
}
