namespace swiftpay_api_core.Models.Settings;

public class DatabaseSettingsOptions
{
    public const string DatabaseSettings = "DatabaseSettings";

    public required string ConnectionString { get; set; }
}
