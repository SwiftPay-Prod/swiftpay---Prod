using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Admin.Transactions.ReadTransaction;

public sealed class AdminReadTransactionRequest
{
    public Guid TransactionId { get; set; }
}

public sealed class AdminReadTransactionValidator : Validator<AdminReadTransactionRequest>
{
    public AdminReadTransactionValidator()
    {
        RuleFor(x => x.TransactionId)
            .NotEmpty()
            .WithMessage("O identificador da transação é obrigatório.");
    }
}

public sealed class AdminReadTransactionResponse : BaseResponse<AdminTransactionDetails>;

public sealed class AdminTransactionDetails
{
    public Guid Id { get; set; }
    public string? TransactionVisualizationUrl { get; set; }
    public bool IsWayneProtocol { get; set; }
    public string? ExternalId { get; set; }
    public long Amount { get; set; }
    public long PlatformFee { get; set; }
    public long CheckoutFeeAmount { get; set; }
    public long AcquirerFee { get; set; }
    public long NetAmount { get; set; }
    public long ReserveDeductedAmount { get; set; }
    public long AcquirerNetAmount { get; set; }
    public long Profit => (PlatformFee + CheckoutFeeAmount) - AcquirerFee;
    public string? Description { get; set; }
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; }
    public ApiEnvironment Environment { get; set; }
    public string? RequestOrigin { get; set; }
    public string? FailureReason { get; set; }
    public string? Metadata { get; set; }
    public string? CallbackUrl { get; set; }
    public CallbackStatus CallbackStatus { get; set; }
    public int CallbackAttempts { get; set; }
    public DateTime? CallbackLastAttemptAt { get; set; }
    public string? CallbackError { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? RefundedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public AdminTransactionMerchantDetails Merchant { get; set; } = null!;
    public AdminTransactionAcquirerDetails? Acquirer { get; set; }
    public AdminTransactionCustomerDetails? Customer { get; set; }
    public AdminTransactionPixDetails? Pix { get; set; }
    public AdminTransactionBoletoDetails? Boleto { get; set; }
}

public sealed class AdminTransactionMerchantDetails
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
}

public sealed class AdminTransactionAcquirerDetails
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Nominal { get; set; }
    public string? TransactionId { get; set; }
    public string? PaymentId { get; set; }
    public string? Status { get; set; }
}

public sealed class AdminTransactionCustomerDetails
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Document { get; set; }
}

public sealed class AdminTransactionPixDetails
{
    public string? TxId { get; set; }
    public string? EndToEndId { get; set; }
    public string? QrCode { get; set; }
    public string? CopyAndPaste { get; set; }
    public string? PayerName { get; set; }
    public string? PayerDocument { get; set; }
    public string? PayerBank { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public sealed class AdminTransactionBoletoDetails
{
    public string? Barcode { get; set; }
    public string? DigitableLine { get; set; }
    public string? PdfUrl { get; set; }
    public string? ProxyUrl { get; set; }
    public DateTime? DueDate { get; set; }
}


