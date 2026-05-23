namespace Swiftpay.Domain.ValueObjects;

public class LedgerTransactionResult
{
    public bool IsSuccess { get; private set; }
    public string? TransactionId { get; private set; }
    public long? NewBalance { get; private set; }
    public string? ErrorMessage { get; private set; }

    public static LedgerTransactionResult Ok(string transactionId, long newBalance) =>
        new() { IsSuccess = true, TransactionId = transactionId, NewBalance = newBalance };

    public static LedgerTransactionResult Fail(string errorMessage) =>
        new() { IsSuccess = false, ErrorMessage = errorMessage };
}
