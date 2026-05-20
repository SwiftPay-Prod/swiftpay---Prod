using System.Globalization;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.Ledger;

namespace safefy_api_core.Repositories;

public class LedgerRepository(PrimaryDbContext dbContext) : ILedgerRepository
{
    public async Task<Account> GetOrCreateMerchantAvailableAccountAsync(Guid merchantId, ApiEnvironment environment, Guid? merchantAcquirerId = null)
    {
        return await GetOrCreateAccountAsync(merchantId, null, AccountType.MerchantAvailable, environment, merchantAcquirerId);
    }

    public async Task<Account> GetOrCreateMerchantPendingAccountAsync(Guid merchantId, ApiEnvironment environment, Guid? merchantAcquirerId = null)
    {
        return await GetOrCreateAccountAsync(merchantId, null, AccountType.MerchantPending, environment, merchantAcquirerId);
    }

    public async Task<Account> GetOrCreateMerchantBlockedAccountAsync(Guid merchantId, ApiEnvironment environment, Guid? merchantAcquirerId = null)
    {
        return await GetOrCreateAccountAsync(merchantId, null, AccountType.MerchantBlocked, environment, merchantAcquirerId);
    }

    public async Task<Account> GetOrCreateMerchantReservedAccountAsync(Guid merchantId, ApiEnvironment environment, Guid? merchantAcquirerId = null)
    {
        return await GetOrCreateAccountAsync(merchantId, null, AccountType.MerchantReserved, environment, merchantAcquirerId);
    }

    public async Task<Account> GetOrCreateMerchantPayoutsOutAccountAsync(Guid merchantId, ApiEnvironment environment, Guid? merchantAcquirerId = null)
    {
        return await GetOrCreateAccountAsync(merchantId, null, AccountType.MerchantPayoutsOut, environment, merchantAcquirerId);
    }

    public async Task<long> SumMerchantAccountBalanceByTypeAsync(Guid merchantId, AccountType type, ApiEnvironment environment)
    {
        var balance = await dbContext.Accounts
            .IgnoreQueryFilters()
            .Where(a => a.MerchantId == merchantId && a.Type == type && a.Environment == environment)
            .Select(a => (long?)a.Balance)
            .SumAsync();

        return balance ?? 0;
    }

    public async Task<long> GetMerchantWithdrawNowAvailableBalanceAsync(Guid merchantId, ApiEnvironment environment)
    {
        var currentBucket = await dbContext.Accounts
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(a => a.MerchantId == merchantId
                && a.Type == AccountType.MerchantAvailable
                && a.Environment == environment
                && a.Balance > 0)
            .Join(
                dbContext.MerchantAcquirers.IgnoreQueryFilters().AsNoTracking(),
                a => a.MerchantAcquirerId,
                ma => ma.Id,
                (a, ma) => new
                {
                    a.Balance,
                    ma.ActivatedAt,
                    ma.CreatedAt,
                    ma.Id
                })
            .OrderBy(x => x.ActivatedAt ?? x.CreatedAt)
            .ThenBy(x => x.Id)
            .FirstOrDefaultAsync();

        if (currentBucket != null)
            return currentBucket.Balance;

        var legacyBucket = await dbContext.Accounts
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(a => a.MerchantId == merchantId
                && a.Type == AccountType.MerchantAvailable
                && a.Environment == environment
                && a.Balance > 0
                && a.MerchantAcquirerId == null)
            .OrderBy(a => a.CreatedAt)
            .ThenBy(a => a.Id)
            .FirstOrDefaultAsync();

        return legacyBucket?.Balance ?? 0;
    }

    public async Task<long> GetMerchantAvailableBalanceByAcquirerAsync(Guid merchantId, Guid merchantAcquirerId, ApiEnvironment environment)
    {
        var balance = await dbContext.Accounts
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(a => a.MerchantId == merchantId
                && a.Type == AccountType.MerchantAvailable
                && a.Environment == environment
                && a.MerchantAcquirerId == merchantAcquirerId)
            .Select(a => (long?)a.Balance)
            .SumAsync();

        return balance ?? 0;
    }

    public async Task<List<MerchantAcquirerBucketBalance>> GetMerchantAvailableAccountBalancesAsync(Guid merchantId, ApiEnvironment environment)
    {
        var legacyBalance = await dbContext.Accounts
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(a => a.MerchantId == merchantId
                && a.Type == AccountType.MerchantAvailable
                && a.Environment == environment
                && a.Balance > 0
                && a.MerchantAcquirerId == null)
            .Select(a => a.Balance)
            .SumAsync();

        var acquirerBalances = await dbContext.Accounts
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(a => a.MerchantId == merchantId
                && a.Type == AccountType.MerchantAvailable
                && a.Environment == environment
                && a.Balance > 0
                && a.MerchantAcquirerId != null)
            .Join(
                dbContext.MerchantAcquirers.IgnoreQueryFilters().AsNoTracking(),
                a => a.MerchantAcquirerId,
                ma => ma.Id,
                (a, ma) => new
                {
                    a.Balance,
                    SortKey = ma.ActivatedAt ?? ma.CreatedAt,
                    ma.Id
                })
            .OrderBy(x => x.SortKey)
            .ThenBy(x => x.Id)
            .Select(x => new MerchantAcquirerBucketBalance
            {
                MerchantAcquirerId = x.Id,
                Balance = x.Balance
            })
            .ToListAsync();

        var result = new List<MerchantAcquirerBucketBalance>();
        if (legacyBalance > 0)
        {
            result.Add(new MerchantAcquirerBucketBalance
            {
                MerchantAcquirerId = null,
                Balance = legacyBalance
            });
        }

        result.AddRange(acquirerBalances);
        return result;
    }

    public async Task<Account> GetOrCreateAcquirerSettlementAccountAsync(Guid acquirerId, ApiEnvironment environment)
    {
        return await GetOrCreateAccountAsync(null, acquirerId, AccountType.AcquirerSettlement, environment);
    }

    public async Task<Account> GetOrCreateAcquirerPayoutsOutAccountAsync(Guid acquirerId, ApiEnvironment environment)
    {
        return await GetOrCreateAccountAsync(null, acquirerId, AccountType.AcquirerPayoutsOut, environment);
    }

    public async Task<Account> GetOrCreatePlatformBlockedAccountAsync(ApiEnvironment environment)
    {
        return await GetOrCreatePlatformAccountAsync(
            Constants.SystemAccountIds.PlatformBlocked,
            AccountType.PlatformBlocked,
            environment);
    }

    public async Task<Account> GetOrCreatePlatformPayoutsOutAccountAsync(ApiEnvironment environment)
    {
        return await GetOrCreatePlatformAccountAsync(
            Constants.SystemAccountIds.PlatformPayoutsOut,
            AccountType.PlatformPayoutsOut,
            environment);
    }

    private async Task<Account> GetOrCreatePlatformAccountAsync(Guid productionAccountId, AccountType type, ApiEnvironment environment)
    {
        Account? account = null;

        if (environment == ApiEnvironment.Production)
        {
            account = await dbContext.Accounts
                .IgnoreQueryFilters()
                .Where(a => a.Id == productionAccountId)
                .OrderBy(a => a.Id)
                .FirstOrDefaultAsync();
        }

        account ??= await dbContext.Accounts
            .IgnoreQueryFilters()
            .Where(a => a.MerchantId == null
                     && a.AcquirerId == null
                     && a.Type == type
                     && a.Environment == environment)
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync();

        if (account == null)
        {
            account = new Account
            {
                Id = environment == ApiEnvironment.Production ? productionAccountId : Guid.CreateVersion7(),
                MerchantId = null,
                AcquirerId = null,
                Type = type,
                Currency = CurrencyType.BRL,
                Balance = 0,
                Environment = environment
            };
            dbContext.Accounts.Add(account);
            await dbContext.SaveChangesAsync();
        }

        return account;
    }

    public async Task<Account?> GetSystemAccountAsync(Guid accountId)
    {
        return await dbContext.Accounts
            .Where(a => a.Id == accountId)
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync();
    }

    public async Task<LedgerTransaction> CreateTransactionWithAtomicBalanceUpdateAsync(
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
        LedgerTransactionStatus status = LedgerTransactionStatus.Approved)
    {
        var strategy = dbContext.Database.CreateExecutionStrategy();
        
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync();
            
            try
            {
                foreach (var (accountId, delta) in balanceUpdates)
                {
                    var rowsAffected = await dbContext.Database.ExecuteSqlRawAsync(
                        "UPDATE \"Accounts\" SET \"Balance\" = \"Balance\" + {0}, \"UpdatedAt\" = {1} WHERE \"Id\" = {2}",
                        delta, DateTime.UtcNow, accountId);
                    
                    if (rowsAffected == 0)
                    {
                        throw new InvalidOperationException($"Account {accountId} not found for balance update.");
                    }
                }

                var ledgerTransaction = new LedgerTransaction
                {
                    Amount = amount,
                    Operation = operation,
                    Status = status,
                    PaymentId = paymentId,
                    PayoutId = payoutId,
                    PlatformPayoutId = platformPayoutId,
                    PlatformPayoutItemId = platformPayoutItemId,
                    Notes = notes,
                    LedgerEntries = entries
                };

                dbContext.LedgerTransactions.Add(ledgerTransaction);

                foreach (var entry in entries)
                {
                    entry.LedgerTransactionId = ledgerTransaction.Id;
                }

                if (merchantBalanceDeltas != null)
                {
                    await dbContext.Database.ExecuteSqlRawAsync(
                        """
                        UPDATE "MerchantBalances" SET
                            "LifetimeVolume"   = "LifetimeVolume"   + {0},
                            "LifetimeFeesPaid" = "LifetimeFeesPaid" + {1},
                            "LifetimePayouts"  = "LifetimePayouts"  + {2},
                            "LifetimeRefunds"  = "LifetimeRefunds"  + {3},
                            "VolumeToday"      = "VolumeToday"      + {4},
                            "VolumeThisWeek"   = "VolumeThisWeek"   + {5},
                            "VolumeThisMonth"  = "VolumeThisMonth"  + {6},
                            "UpdatedAt"        = {7}
                        WHERE "MerchantId" = {8} AND "Environment" = {9}
                        """,
                        merchantBalanceDeltas.LifetimeVolumeDelta,
                        merchantBalanceDeltas.LifetimeFeesPaidDelta,
                        merchantBalanceDeltas.LifetimePayoutsDelta,
                        merchantBalanceDeltas.LifetimeRefundsDelta,
                        merchantBalanceDeltas.VolumeTodayDelta,
                        merchantBalanceDeltas.VolumeThisWeekDelta,
                        merchantBalanceDeltas.VolumeThisMonthDelta,
                        DateTime.UtcNow,
                        merchantBalanceDeltas.MerchantId,
                        merchantBalanceDeltas.Environment.ToString());
                }

                await dbContext.SaveChangesAsync();
                await transaction.CommitAsync();

                return ledgerTransaction;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        });
    }

    public async Task<long> GetAccountBalanceAsync(Guid accountId)
    {
        return await dbContext.Accounts
            .Where(a => a.Id == accountId)
            .OrderBy(a => a.Id)
            .Select(a => a.Balance)
            .FirstOrDefaultAsync();
    }

    public async Task<bool> CheckSufficientBalanceAsync(Guid accountId, long requiredAmount)
    {
        var balance = await dbContext.Accounts
            .Where(a => a.Id == accountId)
            .OrderBy(a => a.Id)
            .Select(a => a.Balance)
            .FirstOrDefaultAsync();
        
        return balance >= requiredAmount;
    }

    public async Task<MerchantBalance> GetOrCreateMerchantBalanceAsync(Guid merchantId, ApiEnvironment environment)
    {
        var now = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(now);
        var (weekNumber, weekYear) = GetIsoWeekOfYear(now);

        // Use INSERT ... ON CONFLICT to avoid race conditions
        var newId = Guid.CreateVersion7();
        var envString = environment.ToString();

        await dbContext.Database.ExecuteSqlRawAsync(
            """
            INSERT INTO "MerchantBalances" (
                "Id", "MerchantId", "Environment", "LifetimeVolume", "LifetimePayouts", 
                "LifetimeRefunds", "LifetimeFeesPaid", "VolumeToday", "TodayDate", 
                "VolumeThisWeek", "WeekNumber", "WeekYear", "VolumeThisMonth", 
                "MonthNumber", "MonthYear", "CreatedAt", "UpdatedAt"
            ) VALUES (
                {0}, {1}, {2}, 0, 0, 0, 0, 0, {3}, 0, {4}, {5}, 0, {6}, {7}, {8}, {8}
            )
            ON CONFLICT ("MerchantId", "Environment") DO NOTHING
            """,
            newId, merchantId, envString, today, weekNumber, weekYear, now.Month, now.Year, now);

        // Now fetch the record (either newly created or existing)
        var balance = await dbContext.MerchantBalances
            .IgnoreQueryFilters()
            .Where(b => b.MerchantId == merchantId && b.Environment == environment)
            .OrderBy(b => b.Id)
            .FirstAsync();

        // Reset period counters if needed
        var needsUpdate = false;

        if (balance.TodayDate != today)
        {
            balance.VolumeToday = 0;
            balance.TodayDate = today;
            needsUpdate = true;
        }

        if (balance.WeekNumber != weekNumber || balance.WeekYear != weekYear)
        {
            balance.VolumeThisWeek = 0;
            balance.WeekNumber = weekNumber;
            balance.WeekYear = weekYear;
            needsUpdate = true;
        }

        if (balance.MonthNumber != now.Month || balance.MonthYear != now.Year)
        {
            balance.VolumeThisMonth = 0;
            balance.MonthNumber = now.Month;
            balance.MonthYear = now.Year;
            needsUpdate = true;
        }

        if (needsUpdate)
        {
            await dbContext.SaveChangesAsync();
        }

        return balance;
    }

    public async Task<List<LedgerEntry>> GetLastTransactionsAsync(Guid merchantId, ApiEnvironment environment, int count = 5)
    {
        var merchantAccountIds = await dbContext.Accounts
            .IgnoreQueryFilters()
            .Where(a => a.MerchantId == merchantId && a.Environment == environment)
            .Select(a => a.Id)
            .ToListAsync();

        if (merchantAccountIds.Count == 0)
            return [];

        return await dbContext.LedgerEntries
            .Where(e => merchantAccountIds.Contains(e.AccountId))
            .OrderByDescending(e => e.Timestamp)
            .Take(count)
            .ToListAsync();
    }

    private async Task<Guid?> ResolveMerchantAcquirerIdAsync(Guid merchantId)
    {
        return await dbContext.MerchantAcquirers
            .IgnoreQueryFilters()
            .Where(ma => ma.MerchantId == merchantId && ma.IsActive)
            .OrderBy(ma => ma.ActivatedAt ?? ma.CreatedAt)
            .Select(ma => (Guid?)ma.Id)
            .FirstOrDefaultAsync();
    }

    private static bool IsMerchantScopedType(AccountType type)
    {
        return type is AccountType.MerchantAvailable
            or AccountType.MerchantPending
            or AccountType.MerchantBlocked
            or AccountType.MerchantReserved
            or AccountType.MerchantPayoutsOut;
    }

    private async Task<Account> GetOrCreateAccountAsync(Guid? merchantId, Guid? acquirerId, AccountType type, ApiEnvironment environment, Guid? merchantAcquirerId = null)
    {
        Account? account;
        
        if (merchantId.HasValue)
        {
            var resolvedMerchantAcquirerId = merchantAcquirerId;
            if (IsMerchantScopedType(type) && !resolvedMerchantAcquirerId.HasValue)
            {
                resolvedMerchantAcquirerId = await ResolveMerchantAcquirerIdAsync(merchantId.Value);
            }

            account = await dbContext.Accounts
                .IgnoreQueryFilters()
                .Where(a => a.MerchantId == merchantId
                    && a.Type == type
                    && a.Environment == environment
                    && a.MerchantAcquirerId == resolvedMerchantAcquirerId)
                .OrderBy(a => a.Id)
                .FirstOrDefaultAsync();

            var legacyAccount = await dbContext.Accounts
                .IgnoreQueryFilters()
                .Where(a => a.MerchantId == merchantId
                    && a.Type == type
                    && a.Environment == environment
                    && a.MerchantAcquirerId == null)
                .OrderBy(a => a.CreatedAt)
                .ThenBy(a => a.Id)
                .FirstOrDefaultAsync();

            if (legacyAccount != null && IsMerchantScopedType(type) && resolvedMerchantAcquirerId.HasValue)
            {
                if (account != null)
                {
                    if (legacyAccount.Balance != 0)
                    {
                        account.Balance += legacyAccount.Balance;
                    }

                    legacyAccount.Balance = 0;
                    legacyAccount.UpdatedAt = DateTime.UtcNow;
                    account.UpdatedAt = DateTime.UtcNow;
                    await dbContext.SaveChangesAsync();
                }
                else
                {
                    legacyAccount.MerchantAcquirerId = resolvedMerchantAcquirerId;
                    legacyAccount.UpdatedAt = DateTime.UtcNow;
                    await dbContext.SaveChangesAsync();
                    account = legacyAccount;
                }
            }

            merchantAcquirerId = resolvedMerchantAcquirerId;
        }
        else if (acquirerId.HasValue)
        {
            account = await dbContext.Accounts
                .IgnoreQueryFilters()
                .Where(a => a.AcquirerId == acquirerId && a.Type == type && a.Environment == environment)
                .OrderBy(a => a.Id)
                .FirstOrDefaultAsync();
        }
        else
        {
            throw new ArgumentException("Either merchantId or acquirerId must be provided.");
        }

        if (account == null)
        {
            account = new Account
            {
                Id = Guid.CreateVersion7(),
                MerchantId = merchantId,
                AcquirerId = acquirerId,
                MerchantAcquirerId = merchantAcquirerId,
                Type = type,
                Currency = CurrencyType.BRL,
                Balance = 0,
                Environment = environment
            };
            dbContext.Accounts.Add(account);
            await dbContext.SaveChangesAsync();
        }

        return account;
    }

    private static (int WeekNumber, int Year) GetIsoWeekOfYear(DateTime date)
    {
        var cal = CultureInfo.InvariantCulture.Calendar;
        var weekNumber = cal.GetWeekOfYear(date, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);

        var year = date.Year;
        if (weekNumber >= 52 && date.Month == 1)
            year--;
        else if (weekNumber == 1 && date.Month == 12)
            year++;

        return (weekNumber, year);
    }
}
