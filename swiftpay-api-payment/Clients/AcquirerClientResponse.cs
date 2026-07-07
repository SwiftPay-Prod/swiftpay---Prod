namespace swiftpay_api_payment.Clients;

public sealed record AcquirerClientResponse<T>
{
    public bool Success { get; init; }
    public int? StatusCode { get; init; }
    public string? ResponseBody { get; init; }
    public string? ErrorCode { get; init; }
    public string? ErrorMessage { get; init; }
    public T? Data { get; init; }
}
