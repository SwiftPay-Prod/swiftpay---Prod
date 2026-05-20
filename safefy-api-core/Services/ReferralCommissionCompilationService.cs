using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Services;

public sealed class ReferralCommissionCompilationService(
    PrimaryDbContext dbContext,
    ILogger<ReferralCommissionCompilationService> logger
) : IReferralCommissionCompilationService
{
    public async Task ResetReferralCompilationForReferredUserAsync(
        Guid oldReferrerUserId,
        Guid referredUserId,
        CancellationToken ct = default)
    {
        var movements = await dbContext.ReferralCommissionMovements
            .IgnoreQueryFilters()
            .Where(m => m.ReferrerUserId == oldReferrerUserId
                     && m.ReferredUserId == referredUserId)
            .ToListAsync(ct);

        if (movements.Count > 0)
        {
            dbContext.ReferralCommissionMovements.RemoveRange(movements);
            await dbContext.SaveChangesAsync(ct);
        }

        await RecomputeReferrerBalancesAsync(oldReferrerUserId, ct);
        await RecomputeReferrerReferredSummariesAsync(oldReferrerUserId, referredUserId, ct);

        await dbContext.SaveChangesAsync(ct);
    }

    public async Task EnsureReferralLinkStructuresAsync(Guid referrerUserId, Guid referredUserId, CancellationToken ct = default)
    {
        await EnsureBalanceRowAsync(referrerUserId, ApiEnvironment.Sandbox, ct);
        await EnsureBalanceRowAsync(referrerUserId, ApiEnvironment.Production, ct);

        await EnsureSummaryRowAsync(referrerUserId, referredUserId, ApiEnvironment.Sandbox, ct);
        await EnsureSummaryRowAsync(referrerUserId, referredUserId, ApiEnvironment.Production, ct);

        await dbContext.SaveChangesAsync(ct);
    }

    public Task RegisterPaymentCompletedMovementAsync(
        Guid paymentId,
        Guid merchantId,
        long sourceAmount,
        ApiEnvironment environment,
        DateTime occurredAt,
        CancellationToken ct = default)
    {
        return RegisterMovementAsync(
            ReferralCommissionMovementSourceType.Payment,
            paymentId,
            merchantId,
            sourceAmount,
            environment,
            occurredAt,
            ct);
    }

    public Task RegisterPayoutCompletedMovementAsync(
        Guid payoutId,
        Guid merchantId,
        long sourceAmount,
        ApiEnvironment environment,
        DateTime occurredAt,
        CancellationToken ct = default)
    {
        return RegisterMovementAsync(
            ReferralCommissionMovementSourceType.Payout,
            payoutId,
            merchantId,
            sourceAmount,
            environment,
            occurredAt,
            ct);
    }

    private async Task RegisterMovementAsync(
        ReferralCommissionMovementSourceType sourceType,
        Guid sourceId,
        Guid merchantId,
        long sourceAmount,
        ApiEnvironment environment,
        DateTime occurredAt,
        CancellationToken ct)
    {
        try
        {
            var referredUserId = await dbContext.Merchants
                .AsNoTracking()
                .Where(m => m.Id == merchantId)
                .Select(m => (Guid?)m.UserId)
                .FirstOrDefaultAsync(ct);

            if (!referredUserId.HasValue)
            {
                return;
            }

            var referredUser = await dbContext.Users
                .AsNoTracking()
                .Where(u => u.Id == referredUserId.Value)
                .Select(u => new
                {
                    u.Id,
                    u.ReferredByUserId,
                    StartAt = u.ReferredAt ?? u.CreatedAt
                })
                .FirstOrDefaultAsync(ct);

            if (referredUser?.ReferredByUserId == null)
            {
                return;
            }

            var settings = await ResolveReferralSettingsAsync(referredUser.ReferredByUserId.Value, ct);
            var endAt = referredUser.StartAt.AddMonths(settings.DurationMonths);
            if (occurredAt < referredUser.StartAt || occurredAt > endAt)
            {
                return;
            }

            if (sourceAmount <= 0)
            {
                return;
            }

            var commissionAmount = CalculateCommission(sourceAmount, settings.CommissionPercentage);
            if (commissionAmount <= 0)
            {
                return;
            }

            var alreadyExists = await dbContext.ReferralCommissionMovements
                .IgnoreQueryFilters()
                .AsNoTracking()
                .AnyAsync(m => m.SourceType == sourceType
                            && m.SourceId == sourceId
                            && m.ReferrerUserId == referredUser.ReferredByUserId.Value
                            && m.ReferredUserId == referredUser.Id
                            && m.Environment == environment, ct);

            if (alreadyExists)
            {
                return;
            }

            dbContext.ReferralCommissionMovements.Add(new ReferralCommissionMovement
            {
                Id = Guid.CreateVersion7(),
                ReferrerUserId = referredUser.ReferredByUserId.Value,
                ReferredUserId = referredUser.Id,
                SourceType = sourceType,
                SourceId = sourceId,
                SourceAmount = sourceAmount,
                ReferralCommissionPercentage = settings.CommissionPercentage,
                CommissionAmount = commissionAmount,
                Environment = environment,
                OccurredAt = occurredAt,
                Description = sourceType == ReferralCommissionMovementSourceType.Payment
                    ? "Comissão gerada por pagamento confirmado"
                    : "Comissão gerada por saque concluído"
            });

            var balance = await dbContext.ReferralCommissionBalances
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(b => b.ReferrerUserId == referredUser.ReferredByUserId.Value
                                       && b.Environment == environment, ct);

            if (balance == null)
            {
                balance = new ReferralCommissionBalance
                {
                    Id = Guid.CreateVersion7(),
                    ReferrerUserId = referredUser.ReferredByUserId.Value,
                    Environment = environment,
                    AvailableBalance = 0,
                    TotalGenerated = 0,
                    TotalPaid = 0,
                    TotalPendingWithdrawal = 0
                };

                dbContext.ReferralCommissionBalances.Add(balance);
            }

            balance.AvailableBalance += commissionAmount;
            balance.TotalGenerated += commissionAmount;

            var summary = await dbContext.ReferralReferredUserSummaries
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(s => s.ReferrerUserId == referredUser.ReferredByUserId.Value
                                       && s.ReferredUserId == referredUser.Id
                                       && s.Environment == environment, ct);

            if (summary == null)
            {
                summary = new ReferralReferredUserSummary
                {
                    Id = Guid.CreateVersion7(),
                    ReferrerUserId = referredUser.ReferredByUserId.Value,
                    ReferredUserId = referredUser.Id,
                    Environment = environment,
                    TotalCommissionFromPayments = 0,
                    TotalCommissionFromPayouts = 0,
                    TotalCommissionAmount = 0
                };

                dbContext.ReferralReferredUserSummaries.Add(summary);
            }

            if (sourceType == ReferralCommissionMovementSourceType.Payment)
            {
                summary.TotalCommissionFromPayments += commissionAmount;
            }
            else
            {
                summary.TotalCommissionFromPayouts += commissionAmount;
            }

            summary.TotalCommissionAmount += commissionAmount;
            summary.LastMovementAt = occurredAt;

            await dbContext.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex)
        {
            logger.LogError(ex,
                "Error persisting referral commission movement: SourceType={SourceType}, SourceId={SourceId}, MerchantId={MerchantId}, Environment={Environment}",
                sourceType,
                sourceId,
                merchantId,
                environment);
        }
    }

    private async Task EnsureBalanceRowAsync(Guid referrerUserId, ApiEnvironment environment, CancellationToken ct)
    {
        var exists = await dbContext.ReferralCommissionBalances
            .IgnoreQueryFilters()
            .AsNoTracking()
            .AnyAsync(b => b.ReferrerUserId == referrerUserId && b.Environment == environment, ct);

        if (exists)
        {
            return;
        }

        dbContext.ReferralCommissionBalances.Add(new ReferralCommissionBalance
        {
            Id = Guid.CreateVersion7(),
            ReferrerUserId = referrerUserId,
            Environment = environment,
            AvailableBalance = 0,
            TotalGenerated = 0,
            TotalPaid = 0,
            TotalPendingWithdrawal = 0
        });
    }

    private async Task EnsureSummaryRowAsync(Guid referrerUserId, Guid referredUserId, ApiEnvironment environment, CancellationToken ct)
    {
        var exists = await dbContext.ReferralReferredUserSummaries
            .IgnoreQueryFilters()
            .AsNoTracking()
            .AnyAsync(s => s.ReferrerUserId == referrerUserId
                        && s.ReferredUserId == referredUserId
                        && s.Environment == environment, ct);

        if (exists)
        {
            return;
        }

        dbContext.ReferralReferredUserSummaries.Add(new ReferralReferredUserSummary
        {
            Id = Guid.CreateVersion7(),
            ReferrerUserId = referrerUserId,
            ReferredUserId = referredUserId,
            Environment = environment,
            TotalCommissionFromPayments = 0,
            TotalCommissionFromPayouts = 0,
            TotalCommissionAmount = 0,
            LastMovementAt = null
        });
    }

    private async Task RecomputeReferrerBalancesAsync(Guid referrerUserId, CancellationToken ct)
    {
        await RecomputeReferrerBalanceAsync(referrerUserId, ApiEnvironment.Sandbox, ct);
        await RecomputeReferrerBalanceAsync(referrerUserId, ApiEnvironment.Production, ct);
    }

    private async Task RecomputeReferrerBalanceAsync(Guid referrerUserId, ApiEnvironment environment, CancellationToken ct)
    {
        var totalGenerated = await dbContext.ReferralCommissionMovements
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(m => m.ReferrerUserId == referrerUserId && m.Environment == environment)
            .Select(m => (long?)m.CommissionAmount)
            .SumAsync(ct) ?? 0;

        var balance = await dbContext.ReferralCommissionBalances
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(b => b.ReferrerUserId == referrerUserId
                                   && b.Environment == environment, ct);

        if (balance == null)
        {
            balance = new ReferralCommissionBalance
            {
                Id = Guid.CreateVersion7(),
                ReferrerUserId = referrerUserId,
                Environment = environment,
                AvailableBalance = 0,
                TotalGenerated = 0,
                TotalPaid = 0,
                TotalPendingWithdrawal = 0
            };

            dbContext.ReferralCommissionBalances.Add(balance);
        }

        balance.TotalGenerated = totalGenerated;

        var available = totalGenerated - balance.TotalPaid - balance.TotalPendingWithdrawal;
        balance.AvailableBalance = available > 0 ? available : 0;
    }

    private async Task RecomputeReferrerReferredSummariesAsync(Guid referrerUserId, Guid referredUserId, CancellationToken ct)
    {
        await RecomputeReferrerReferredSummaryAsync(referrerUserId, referredUserId, ApiEnvironment.Sandbox, ct);
        await RecomputeReferrerReferredSummaryAsync(referrerUserId, referredUserId, ApiEnvironment.Production, ct);
    }

    private async Task RecomputeReferrerReferredSummaryAsync(Guid referrerUserId, Guid referredUserId, ApiEnvironment environment, CancellationToken ct)
    {
        var movements = await dbContext.ReferralCommissionMovements
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(m => m.ReferrerUserId == referrerUserId
                     && m.ReferredUserId == referredUserId
                     && m.Environment == environment)
            .ToListAsync(ct);

        var totalCommissionFromPayments = movements
            .Where(m => m.SourceType == ReferralCommissionMovementSourceType.Payment)
            .Sum(m => m.CommissionAmount);

        var totalCommissionFromPayouts = movements
            .Where(m => m.SourceType == ReferralCommissionMovementSourceType.Payout)
            .Sum(m => m.CommissionAmount);

        var totalCommissionAmount = totalCommissionFromPayments + totalCommissionFromPayouts;
        var lastMovementAt = movements.Count > 0
            ? movements.Max(m => m.OccurredAt)
            : (DateTime?)null;

        var summary = await dbContext.ReferralReferredUserSummaries
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.ReferrerUserId == referrerUserId
                                   && s.ReferredUserId == referredUserId
                                   && s.Environment == environment, ct);

        if (summary == null)
        {
            summary = new ReferralReferredUserSummary
            {
                Id = Guid.CreateVersion7(),
                ReferrerUserId = referrerUserId,
                ReferredUserId = referredUserId,
                Environment = environment,
                TotalCommissionFromPayments = 0,
                TotalCommissionFromPayouts = 0,
                TotalCommissionAmount = 0,
                LastMovementAt = null
            };

            dbContext.ReferralReferredUserSummaries.Add(summary);
        }

        summary.TotalCommissionFromPayments = totalCommissionFromPayments;
        summary.TotalCommissionFromPayouts = totalCommissionFromPayouts;
        summary.TotalCommissionAmount = totalCommissionAmount;
        summary.LastMovementAt = lastMovementAt;
    }

    private async Task<(int DurationMonths, int CommissionPercentage)> ResolveReferralSettingsAsync(Guid referrerUserId, CancellationToken ct)
    {
        var referrer = await dbContext.Users
            .AsNoTracking()
            .Where(u => u.Id == referrerUserId)
            .Select(u => new
            {
                u.ReferralDurationMonths,
                u.ReferralCommissionPercentage
            })
            .FirstOrDefaultAsync(ct);

        var platformSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .Select(p => new
            {
                p.ReferralDurationMonths,
                p.ReferralCommissionPercentage
            })
            .FirstOrDefaultAsync(ct);

        var configuredDurationMonths = referrer?.ReferralDurationMonths
            ?? platformSettings?.ReferralDurationMonths
            ?? 12;

        var configuredCommissionPercentage = referrer?.ReferralCommissionPercentage
            ?? platformSettings?.ReferralCommissionPercentage
            ?? 1000;

        var durationMonths = configuredDurationMonths > 0 ? configuredDurationMonths : 12;
        var commissionPercentage = configuredCommissionPercentage > 0 ? configuredCommissionPercentage : 1000;

        return (durationMonths, commissionPercentage);
    }

    private static long CalculateCommission(long profitBase, int commissionPercentage)
    {
        if (profitBase <= 0 || commissionPercentage <= 0)
        {
            return 0;
        }

        return (long)Math.Floor(profitBase * commissionPercentage / 10000m);
    }
}
