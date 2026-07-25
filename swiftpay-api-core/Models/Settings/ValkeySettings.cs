namespace swiftpay_api_core.Models.Settings;

public class ValkeySettings
{
    public const string SectionName = "ValkeySettings";

    public required string ConnectionString { get; set; }
    public string InstanceName { get; set; } = "swiftpay:";
}
