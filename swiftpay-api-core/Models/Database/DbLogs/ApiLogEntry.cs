using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Database;

public class ApiLogEntry
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public Guid Id { get; set; }

    public Guid MerchantId { get; set; }

    public string? MerchantName { get; set; }

    public string? MerchantDocument { get; set; }

    public Guid? CredentialId { get; set; }

    [Required]
    public string HttpMethod { get; set; } = null!;

    [Required]
    public string Endpoint { get; set; } = null!;

    public int StatusCode { get; set; }

    [Required]
    public string Action { get; set; } = null!;

    [Required]
    public string Status { get; set; } = null!;

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public string? Location { get; set; }

    public string? Details { get; set; }

    public string? ErrorCode { get; set; }

    public string? RequestBody { get; set; }

    public string? ResponseBody { get; set; }

    public Guid? AcquirerId { get; set; }

    public string? AcquirerType { get; set; }

    public Guid? ResourceId { get; set; }

    public ApiLogResourceType? ResourceType { get; set; }

    public long? ResponseTimeMs { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ApiLogAction
{
    Authenticate,
    TokenRefresh,
    CreateCustomer,
    UpdateCustomer,
    DeleteCustomer,
    CreatePayment,
    RefundPayment,
    CancelPayment,
    SimulatePayment,
    CreateCashout,
    CancelCashout,
    ApproveCashout,
    RejectCashout,
    CreatePlatformPayout,
    CancelPlatformPayout,
    ReprocessPlatformPayout,
    CreateSimulatedPlatformPayout,
    CreateOrder,
    WebhookReceived,
    AcquirerWebhookReceived,
    AcquirerRequestFailed,
    SyncSubmerchantSplitConfig,
    RateLimitExceeded,
    InvalidRequest,
    Unauthorized
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ApiLogResourceType
{
    Credential,
    Customer,
    Payment,
    Payout,
    Merchant,
    Acquirer,
    Checkout,
    Webhook,
    Token,
    Ledger,
    Notification,
    Order
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ApiLogStatus
{
    Success,
    Failed,
    Warning
}
