using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;

namespace safefy_api.Services.Internal;

public sealed class ReferralCommissionCalculator(PrimaryDbContext dbContext)
{
    public async Task<ReferralCommissionSummary> CalculateForReferrerAsync(Guid referrerUserId, CancellationToken ct)
    {
        var user = await dbContext.Users
            .AsNoTracking()
            .Where(u => u.Id == referrerUserId)
            .Select(u => new
            {
                u.Id,
                u.ReferralDurationMonths,
                u.ReferralCommissionPercentage
            })
            .OrderBy(x => x.Id)
            .FirstOrDefaultAsync(ct);

        if (user == null)
        {
            return new ReferralCommissionSummary();
        }

        var platformReferralSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .Select(p => new
            {
                p.ReferralDurationMonths,
                p.ReferralCommissionPercentage
            })
            .FirstOrDefaultAsync(ct);

        var referralDurationMonths = user.ReferralDurationMonths
            ?? platformReferralSettings?.ReferralDurationMonths
            ?? 12;

        var referralCommissionPercentage = user.ReferralCommissionPercentage
            ?? platformReferralSettings?.ReferralCommissionPercentage
            ?? 1000;

        var referredUsersRaw = await dbContext.Users
            .AsNoTracking()
            .Where(u => u.ReferredByUserId == referrerUserId)
            .OrderByDescending(u => u.ReferredAt ?? u.CreatedAt)
            .Select(u => new ReferredUserSummary
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                Status = u.Status,
                ReferredAt = u.ReferredAt,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync(ct);

        var eligibleReferrals = referredUsersRaw
            .Where(u => u.Status == UserStatus.Active)
            .Select(u => new
            {
                UserId = u.Id,
                StartAt = u.ReferredAt ?? u.CreatedAt,
                EndAt = (u.ReferredAt ?? u.CreatedAt).AddMonths(referralDurationMonths)
            })
            .ToList();

        var eligibleUserIds = eligibleReferrals
            .Select(r => r.UserId)
            .ToList();

        var eligibleProfitFromPaymentsByUserId = referredUsersRaw.ToDictionary(u => u.Id, _ => 0L);
        var eligibleProfitFromPayoutsByUserId = referredUsersRaw.ToDictionary(u => u.Id, _ => 0L);

        var eligibleProfitFromPayments = 0L;
        var eligibleProfitFromPayouts = 0L;

        if (eligibleUserIds.Count > 0)
        {
            var referralWindowByUserId = eligibleReferrals.ToDictionary(
                r => r.UserId,
                r => new ReferralWindow(r.StartAt, r.EndAt));

            var merchantOwners = await dbContext.Merchants
                .AsNoTracking()
                .Where(m => eligibleUserIds.Contains(m.UserId))
                .Select(m => new
                {
                    m.Id,
                    m.UserId
                })
                .ToListAsync(ct);

            var merchantOwnerByMerchantId = merchantOwners.ToDictionary(m => m.Id, m => m.UserId);
            var eligibleMerchantIds = merchantOwners.Select(m => m.Id).ToList();

            if (eligibleMerchantIds.Count > 0)
            {
                var paymentProfits = await dbContext.Payments
                    .AsNoTracking()
                    .Where(p => eligibleMerchantIds.Contains(p.MerchantId)
                             && p.Status == PaymentStatus.Completed
                             && p.CompletedAt.HasValue)
                    .Select(p => new
                    {
                        p.MerchantId,
                        EventAt = p.CompletedAt!.Value,
                        Profit = (p.PlatformFee + p.CheckoutTemplateFee) - p.AcquirerFee
                    })
                    .ToListAsync(ct);

                foreach (var payment in paymentProfits)
                {
                    if (payment.Profit <= 0)
                    {
                        continue;
                    }

                    if (!merchantOwnerByMerchantId.TryGetValue(payment.MerchantId, out var ownerUserId))
                    {
                        continue;
                    }

                    if (!referralWindowByUserId.TryGetValue(ownerUserId, out var referralWindow))
                    {
                        continue;
                    }

                    if (payment.EventAt < referralWindow.StartAt || payment.EventAt > referralWindow.EndAt)
                    {
                        continue;
                    }

                    eligibleProfitFromPayments += payment.Profit;
                    eligibleProfitFromPaymentsByUserId[ownerUserId] += payment.Profit;
                }

                var payoutProfits = await dbContext.Payouts
                    .AsNoTracking()
                    .Where(p => eligibleMerchantIds.Contains(p.MerchantId)
                             && p.Status == PayoutStatus.Completed
                             && p.CompletedAt.HasValue)
                    .Select(p => new
                    {
                        p.MerchantId,
                        EventAt = p.CompletedAt!.Value,
                        Profit = p.PlatformFee - p.AcquirerFee
                    })
                    .ToListAsync(ct);

                foreach (var payout in payoutProfits)
                {
                    if (payout.Profit <= 0)
                    {
                        continue;
                    }

                    if (!merchantOwnerByMerchantId.TryGetValue(payout.MerchantId, out var ownerUserId))
                    {
                        continue;
                    }

                    if (!referralWindowByUserId.TryGetValue(ownerUserId, out var referralWindow))
                    {
                        continue;
                    }

                    if (payout.EventAt < referralWindow.StartAt || payout.EventAt > referralWindow.EndAt)
                    {
                        continue;
                    }

                    eligibleProfitFromPayouts += payout.Profit;
                    eligibleProfitFromPayoutsByUserId[ownerUserId] += payout.Profit;
                }
            }
        }

        var referredUsers = referredUsersRaw
            .Select(u =>
            {
                var userProfitFromPayments = eligibleProfitFromPaymentsByUserId.GetValueOrDefault(u.Id, 0L);
                var userProfitFromPayouts = eligibleProfitFromPayoutsByUserId.GetValueOrDefault(u.Id, 0L);
                var userCommissionFromPayments = CalculateCommission(userProfitFromPayments, referralCommissionPercentage);
                var userCommissionFromPayouts = CalculateCommission(userProfitFromPayouts, referralCommissionPercentage);

                return new ReferredUserSummary
                {
                    Id = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    Status = u.Status,
                    ReferredAt = u.ReferredAt,
                    CreatedAt = u.CreatedAt,
                    EligibleProfitFromPayments = userProfitFromPayments,
                    EligibleProfitFromPayouts = userProfitFromPayouts,
                    EstimatedCommissionFromPayments = userCommissionFromPayments,
                    EstimatedCommissionFromPayouts = userCommissionFromPayouts,
                    EstimatedCommissionTotal = userCommissionFromPayments + userCommissionFromPayouts
                };
            })
            .ToList();

        var estimatedCommissionFromPayments = CalculateCommission(eligibleProfitFromPayments, referralCommissionPercentage);
        var estimatedCommissionFromPayouts = CalculateCommission(eligibleProfitFromPayouts, referralCommissionPercentage);
        var estimatedCommissionTotal = estimatedCommissionFromPayments + estimatedCommissionFromPayouts;

        return new ReferralCommissionSummary
        {
            ReferralDurationMonths = referralDurationMonths,
            ReferralCommissionPercentage = referralCommissionPercentage,
            EligibleProfitFromPayments = eligibleProfitFromPayments,
            EligibleProfitFromPayouts = eligibleProfitFromPayouts,
            EstimatedCommissionFromPayments = estimatedCommissionFromPayments,
            EstimatedCommissionFromPayouts = estimatedCommissionFromPayouts,
            EstimatedCommissionTotal = estimatedCommissionTotal,
            ReferredUsers = referredUsers
        };
    }

    private static long CalculateCommission(long profit, int commissionBasisPoints)
    {
        if (profit <= 0 || commissionBasisPoints <= 0)
        {
            return 0;
        }

        return FeeCalculator.CalculateReferralCommission(profit, commissionBasisPoints);
    }

    private sealed record ReferralWindow(DateTime StartAt, DateTime EndAt);
}

public sealed class ReferralCommissionSummary
{
    public int ReferralDurationMonths { get; set; }
    public int ReferralCommissionPercentage { get; set; }
    public long EligibleProfitFromPayments { get; set; }
    public long EligibleProfitFromPayouts { get; set; }
    public long EstimatedCommissionFromPayments { get; set; }
    public long EstimatedCommissionFromPayouts { get; set; }
    public long EstimatedCommissionTotal { get; set; }
    public List<ReferredUserSummary> ReferredUsers { get; set; } = [];
}

public sealed class ReferredUserSummary
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserStatus Status { get; set; }
    public DateTime? ReferredAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public long EligibleProfitFromPayments { get; set; }
    public long EligibleProfitFromPayouts { get; set; }
    public long EstimatedCommissionFromPayments { get; set; }
    public long EstimatedCommissionFromPayouts { get; set; }
    public long EstimatedCommissionTotal { get; set; }
}
