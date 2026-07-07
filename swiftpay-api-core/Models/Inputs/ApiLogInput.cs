using swiftpay_api_core.Models.Database;

namespace swiftpay_api_core.Models.Inputs;

public class ApiLogInput
{
    public ApiLogAction Action { get; set; }
    public ApiLogStatus Status { get; set; }
    public Guid? MerchantId { get; set; }
    public string? MerchantName { get; set; }
    public string? MerchantDocument { get; set; }
    public Guid? CredentialId { get; set; }
    public string? HttpMethod { get; set; } = null!;
    public string? Endpoint { get; set; } = null!;
    public int StatusCode { get; set; }
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Location { get; set; }
    public Guid? ResourceId { get; set; }
    public ApiLogResourceType? ResourceType { get; set; }
    public long? ResponseTimeMs { get; set; }
    public string? ErrorCode { get; set; }
    public Guid? AcquirerId { get; set; }
    public string? AcquirerType { get; set; }
    public string? RequestBody { get; set; }
    public string? ResponseBody { get; set; }
}