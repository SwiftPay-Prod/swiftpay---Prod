namespace swiftpay_api_payment.Clients.Bankizi.Models;

public sealed class BankiziErrorResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public int StatusCode { get; set; }
    public List<BankiziInvalidField>? InvalidFields { get; set; }
}

public sealed class BankiziInvalidField
{
    public string? Field { get; set; }
    public string? Messages { get; set; }
}
