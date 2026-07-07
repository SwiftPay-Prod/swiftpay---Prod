using swiftpay_api_core.Models.Database;

namespace swiftpay_api_core.Models.Inputs;

public class EmailLogInput
{
    public Guid? UserId { get; set; }
    public Guid? MerchantId { get; set; }
    public required string To { get; set; }
    public required string Subject { get; set; }
    public required string Template { get; set; }
    public EmailLogStatus Status { get; set; }
    public string? ErrorMessage { get; set; }
    public Dictionary<string, string>? Parameters { get; set; }
    public string? IpAddress { get; set; }
    public long? SendTimeMs { get; set; }
}