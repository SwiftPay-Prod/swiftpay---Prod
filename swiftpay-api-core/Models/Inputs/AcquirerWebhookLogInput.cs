namespace swiftpay_api_core.Models.Inputs;

public sealed class AcquirerWebhookLogInput
{
    public Guid? AcquirerId { get; set; }

    public string AcquirerType { get; set; } = string.Empty;

    public string AcquirerCode { get; set; } = string.Empty;

    public string HttpMethod { get; set; } = string.Empty;

    public string Endpoint { get; set; } = string.Empty;

    public string? QueryString { get; set; }

    public string? RequestHeaders { get; set; }

    public string? RequestBody { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public string? Location { get; set; }

    public string? CorrelationId { get; set; }

    public string? ContentType { get; set; }

    public long? ContentLength { get; set; }

    public int? StatusCode { get; set; }
}
