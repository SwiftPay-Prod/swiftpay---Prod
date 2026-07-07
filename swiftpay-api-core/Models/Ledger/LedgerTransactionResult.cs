namespace swiftpay_api_core.Models.Ledger;

public class LedgerTransactionResult
{
    public bool Success { get; set; }
    public string? TransactionId { get; set; }
    public string? ErrorMessage { get; set; }
    public long? NewBalance { get; set; }
    public long? PlatformBalance { get; set; }

    public static LedgerTransactionResult Ok(string transactionId, long newBalance) => new()
    {
        Success = true,
        TransactionId = transactionId,
        NewBalance = newBalance
    };

    public static LedgerTransactionResult Ok(string transactionId, long newBalance, long platformBalance) => new()
    {
        Success = true,
        TransactionId = transactionId,
        NewBalance = newBalance,
        PlatformBalance = platformBalance
    };

    public static LedgerTransactionResult Fail(string errorMessage) => new()
    {
        Success = false,
        ErrorMessage = errorMessage
    };
}
