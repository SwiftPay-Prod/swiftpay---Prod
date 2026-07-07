using swiftpay_api_core.Models.Enum;
using swiftpay_api_payment.Models.Transactions;
using swiftpay_api_payment.Services.Sandbox;

namespace swiftpay_api_payment.Interfaces;

public interface ITransactionService
{
    Task<TransactionResult> CreateAsync(CreateTransactionInput input);

    Task<TransactionResult> SimulateAsync(Guid transactionId, Guid merchantId, SimulateAction action);

    Task<TransactionStatusResult> GetStatusAsync(Guid transactionId, Guid merchantId);
}
