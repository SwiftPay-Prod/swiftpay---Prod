using swiftpay_api_core.Models.Database;

namespace swiftpay_api_payment.Models.Transactions;

public record TransactionResult
{
    public bool Success { get; init; }
    public Payment? Payment { get; init; }
    public PaymentPix? PaymentPix { get; init; }
    public Interfaces.Transactions.PaymentCreditCard? PaymentCreditCard { get; init; }
    public PaymentBoleto? PaymentBoleto { get; init; }
    public string? ErrorMessage { get; init; }
    public string? ErrorCode { get; init; }
    public int StatusCode { get; init; } = 200;

    public static TransactionResult Error(string message, string? code = null, int statusCode = 400) => new()
    {
        Success = false,
        ErrorMessage = message,
        ErrorCode = code,
        StatusCode = statusCode
    };
}

public record TransactionStatusResult
{
    public bool Success { get; init; }
    public PaymentStatus Status { get; init; }
    public string? EndToEndId { get; init; }
    public string? PayerName { get; init; }
    public string? PayerDocument { get; init; }
    public string? PayerBank { get; init; }
    public DateTime? CompletedAt { get; init; }
    public string? ErrorMessage { get; init; }
}
