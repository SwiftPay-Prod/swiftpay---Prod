using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Application.Common;

public interface ILedgerService
{
    Task<LedgerTransactionResult> RecordPaymentPendingAsync(Guid paymentId, Guid merchantId, Guid? merchantAcquirerId, long amount, string environment, CancellationToken ct);
    Task<LedgerTransactionResult> RecordPaymentReceivedAsync(Guid paymentId, Guid merchantId, Guid? merchantAcquirerId, long amount, long settlementAmount, long acquirerFee, string environment, CancellationToken ct);
    Task<LedgerTransactionResult> RecordPaymentCancelledAsync(Guid paymentId, Guid merchantId, Guid? merchantAcquirerId, long amount, string environment, CancellationToken ct);
    Task<LedgerTransactionResult> RecordPaymentRefundedAsync(Guid paymentId, Guid merchantId, Guid? merchantAcquirerId, long refundAmount, string environment, CancellationToken ct);
    Task<LedgerTransactionResult> RecordWithdrawalRequestedAsync(Domain.Entities.Withdrawal withdrawal, CancellationToken ct);
    Task<LedgerTransactionResult> RecordWithdrawalCompletedAsync(Domain.Entities.Withdrawal withdrawal, long netAmount, CancellationToken ct);
    Task<LedgerTransactionResult> RecordWithdrawalFailedAsync(Domain.Entities.Withdrawal withdrawal, CancellationToken ct);
    Task<long> GetMerchantAvailableBalanceAsync(Guid merchantId, string environment, CancellationToken ct);
    Task<long> GetMerchantPendingBalanceAsync(Guid merchantId, string environment, CancellationToken ct);
}
