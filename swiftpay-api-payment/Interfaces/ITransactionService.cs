using safefy_api_core.Models.Enum;
using safefy_api_payment.Models.Transactions;
using safefy_api_payment.Services.Sandbox;

namespace safefy_api_payment.Interfaces;

public interface ITransactionService
{
    Task<TransactionResult> CreateAsync(CreateTransactionInput input);

    Task<TransactionResult> SimulateAsync(Guid transactionId, Guid merchantId, SimulateAction action);

    Task<TransactionStatusResult> GetStatusAsync(Guid transactionId, Guid merchantId);
}
