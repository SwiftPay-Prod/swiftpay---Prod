using System.Text.Json.Serialization;

namespace safefy_api_payment.Clients.Bankizi.Models.Withdrawals;

public sealed class BankiziWithdrawResponse
{
    [JsonPropertyName("status")]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public BankiziWithdrawStatus? Status { get; set; }
    
    [JsonPropertyName("txId")]
    public string? TxId { get; set; }
    
    [JsonPropertyName("transactionId")]
    public string? TransactionId { get; set; }
    
    [JsonPropertyName("amount")]
    public long? Amount { get; set; }
    
    [JsonPropertyName("errorMessage")]
    public string? ErrorMessage { get; set; }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum BankiziWithdrawStatus
{
    Generated,
    Done,
    Rejected,
    Failed
}
