using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.Ledger;

namespace swiftpay_api_core.Interfaces;

public interface ILedgerRepository
{
    Task<Account> GetOrCreateMerchantAvailableAccountAsync(Guid merchantId, ApiEnvironment environment, Guid? merchantAcquirerId = null);
    Task<Account> GetOrCreateMerchantPendingAccountAsync(Guid merchantId, ApiEnvironment environment, Guid? merchantAcquirerId = null);
    Task<Account> GetOrCreateMerchantBlockedAccountAsync(Guid merchantId, ApiEnvironment environment, Guid? merchantAcquirerId = null);
    Task<Account> GetOrCreateMerchantReservedAccountAsync(Guid merchantId, ApiEnvironment environment, Guid? merchantAcquirerId = null);
    Task<Account> GetOrCreateMerchantPayoutsOutAccountAsync(Guid merchantId, ApiEnvironment environment, Guid? merchantAcquirerId = null);

    Task<long> SumMerchantAccountBalanceByTypeAsync(Guid merchantId, AccountType type, ApiEnvironment environment);
    Task<long> GetMerchantWithdrawNowAvailableBalanceAsync(Guid merchantId, ApiEnvironment environment);
    Task<long> GetMerchantAvailableBalanceByAcquirerAsync(Guid merchantId, Guid merchantAcquirerId, ApiEnvironment environment);
    Task<List<MerchantAcquirerBucketBalance>> GetMerchantAvailableAccountBalancesAsync(Guid merchantId, ApiEnvironment environment);
    
    Task<Account> GetOrCreateAcquirerSettlementAccountAsync(Guid acquirerId, ApiEnvironment environment);
    Task<Account> GetOrCreateAcquirerPayoutsOutAccountAsync(Guid acquirerId, ApiEnvironment environment);

    Task<Account> GetOrCreatePlatformBlockedAccountAsync(ApiEnvironment environment);
    Task<Account> GetOrCreatePlatformPayoutsOutAccountAsync(ApiEnvironment environment);
    
    Task<Account?> GetSystemAccountAsync(Guid accountId);
    
    Task<MerchantBalance> GetOrCreateMerchantBalanceAsync(Guid merchantId, ApiEnvironment environment);
    Task<List<LedgerEntry>> GetLastTransactionsAsync(Guid merchantId, ApiEnvironment environment, int count = 5);

    Task<LedgerTransaction> CreateTransactionWithAtomicBalanceUpdateAsync(
        LedgerTransactionOperation operation,
        long amount,
        List<LedgerEntry> entries,
        List<(Guid AccountId, long Delta)> balanceUpdates,
        MerchantBalanceDeltas? merchantBalanceDeltas = null,
        Guid? paymentId = null,
        Guid? payoutId = null,
        Guid? platformPayoutId = null,
        Guid? platformPayoutItemId = null,
        string? notes = null,
        LedgerTransactionStatus status = LedgerTransactionStatus.Approved);

    Task<long> GetAccountBalanceAsync(Guid accountId);

    Task<bool> CheckSufficientBalanceAsync(Guid accountId, long requiredAmount);
}
