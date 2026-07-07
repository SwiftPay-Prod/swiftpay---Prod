namespace swiftpay_api_payment.Tests.Models;

// ===================================================================
// Base Response Models
// ===================================================================

public class BaseResponse<T>
{
    public T? Data { get; set; }
    public string? Message { get; set; }
    public ErrorResponse? Error { get; set; }
}

public class BaseResponse
{
    public string? Message { get; set; }
    public ErrorResponse? Error { get; set; }
}

public class ErrorResponse
{
    public string? Message { get; set; }
    public string? Code { get; set; }
}

// ===================================================================
// Auth/Token Response
// ===================================================================

public class TokenResponse : BaseResponse<TokenData> { }

public class TokenData
{
    public string AccessToken { get; set; } = null!;
    public string TokenType { get; set; } = "Bearer";
    public int ExpiresIn { get; set; }
    public string Environment { get; set; } = null!;
}

// ===================================================================
// Payment/PIX Response
// ===================================================================

public class PaymentResponse : BaseResponse<PaymentData> { }

public class PaymentData
{
    public Guid Id { get; set; }
    public string? ExternalId { get; set; }
    public long Amount { get; set; }
    public long Fee { get; set; }
    public long NetAmount { get; set; }
    public string? Currency { get; set; }
    public string? Method { get; set; }
    public string? Status { get; set; }
    public string? Description { get; set; }
    public string? Environment { get; set; }
    public Guid? CustomerId { get; set; }
    public PaymentPixData? Pix { get; set; }
    public string? Metadata { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class PaymentPixData
{
    public string? TxId { get; set; }
    public string? EndToEndId { get; set; }
    public string? QrCode { get; set; }
    public string? CopyAndPaste { get; set; }
    public string? PayerName { get; set; }
    public string? PayerDocument { get; set; }
    public string? PayerBank { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

// ===================================================================
// Customer Response
// ===================================================================

public class CustomerResponse : BaseResponse<CustomerData> { }

public class CustomerData
{
    public Guid Id { get; set; }
    public string? ExternalId { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Document { get; set; }
    public string? DocumentType { get; set; }
    public string? Phone { get; set; }
    public string? Status { get; set; }
    public string? Metadata { get; set; }
    public DateTime CreatedAt { get; set; }
}

// ===================================================================
// Paginated Response
// ===================================================================

public class PaginatedResponse<T> : BaseResponse<PaginatedData<T>> { }

public class PaginatedData<T>
{
    public List<T>? Items { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}

// ===================================================================
// Payment Paginated Response (with totals)
// ===================================================================

public class PaginatedPaymentResponse : BaseResponse<PaginatedPaymentData> { }

public class PaginatedPaymentData
{
    public List<PaymentData>? Items { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
    public long TotalAmount { get; set; }
    public long TotalFees { get; set; }
    public long TotalNetAmount { get; set; }
}

// ===================================================================
// Simulate Transaction Response
// ===================================================================

public class SimulateTransactionResponse : BaseResponse<SimulateTransactionData> { }

public class SimulateTransactionData
{
    public Guid Id { get; set; }
    public string? Status { get; set; }
    public string? SimulatedAction { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? RefundedAt { get; set; }
    public PaymentPixData? Pix { get; set; }
}

// ===================================================================
// Balance Response
// ===================================================================

public class GetBalanceResponse : BaseResponse<BalanceData> { }

public class BalanceData
{
    public string? Currency { get; set; }
    public BalanceInfo? Balance { get; set; }
    public TotalsInfo? Totals { get; set; }
    public PeriodInfo? Period { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class BalanceInfo
{
    public long Available { get; set; }
    public long WithdrawNowAvailable { get; set; }
    public bool RequiresFullWithdrawalNow { get; set; }
    public long Pending { get; set; }
    public long Reserved { get; set; }
    public long Total { get; set; }
}

public class TotalsInfo
{
    public long LifetimeVolume { get; set; }
    public long LifetimePayouts { get; set; }
    public long LifetimeRefunds { get; set; }
}

public class PeriodInfo
{
    public long VolumeToday { get; set; }
    public long VolumeThisWeek { get; set; }
    public long VolumeThisMonth { get; set; }
}

// ===================================================================
// Cashout Response
// ===================================================================

public class CreateCashoutResponse : BaseResponse<CashoutData> { }

public class CashoutData
{
    public Guid Id { get; set; }
    public string? ExternalId { get; set; }
    public long Amount { get; set; }
    public long Fee { get; set; }
    public long NetAmount { get; set; }
    public string Currency { get; set; } = "BRL";
    public string? Status { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SimulateCashoutResponse : BaseResponse<SimulateCashoutData> { }

public class SimulateCashoutData
{
    public Guid Id { get; set; }
    public long Amount { get; set; }
    public long Fee { get; set; }
    public long NetAmount { get; set; }
    public string? Status { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? FailureReason { get; set; }
}
