using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using safefy_api.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Models.Settings;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Users.Referrals.ReadMyReferrals;

public sealed class ReadMyReferralsEndpoint(
    PrimaryDbContext dbContext,
    IOptions<PlatformSettingsOptions> platformSettings,
    IStorageService storageService
) : EndpointWithoutRequest<ReadMyReferralsResponse>
{
    public override void Configure()
    {
        Get("referrals");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadMyReferralsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var user = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null)
        {
            await Send.ResponseAsync(new ReadMyReferralsResponse
            {
                Error = new("Usuário não encontrado.")
            }, 404, ct);
            return;
        }

        var platformReferralSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .Select(p => new
            {
                p.ReferralDurationMonths,
                p.ReferralCommissionPercentage,
                p.ReferralCommissionWithdrawalIntervalValue,
                p.ReferralCommissionWithdrawalIntervalUnit,
                p.ReferralCommissionMinWithdrawalAmount,
                p.ReferralCommissionWithdrawalFeeFixed,
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
            .Where(u => u.ReferredByUserId == user.Id)
            .OrderByDescending(u => u.ReferredAt ?? u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.Status,
                u.ReferredAt
            })
            .ToListAsync(ct);

        var referredUserIds = referredUsersRaw.Select(u => u.Id).ToList();

        var summaryByReferredUserId = new Dictionary<Guid, ReferralReferredUserSummary>();
        var movementProfitsByReferredUserId = new Dictionary<Guid, (long Payments, long Payouts)>();

        if (referredUserIds.Count > 0)
        {
            var summaries = await dbContext.ReferralReferredUserSummaries
                .AsNoTracking()
                .Where(s => s.ReferrerUserId == user.Id && referredUserIds.Contains(s.ReferredUserId))
                .ToListAsync(ct);

            summaryByReferredUserId = summaries
                .GroupBy(s => s.ReferredUserId)
                .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.LastMovementAt).First());

            var movementProfits = await dbContext.ReferralCommissionMovements
                .AsNoTracking()
                .Where(m => m.ReferrerUserId == user.Id && referredUserIds.Contains(m.ReferredUserId))
                .GroupBy(m => new { m.ReferredUserId, m.SourceType })
                .Select(g => new
                {
                    g.Key.ReferredUserId,
                    g.Key.SourceType,
                    TotalProfit = g.Sum(x => x.SourceAmount)
                })
                .ToListAsync(ct);

            movementProfitsByReferredUserId = movementProfits
                .GroupBy(x => x.ReferredUserId)
                .ToDictionary(
                    g => g.Key,
                    g => (
                        Payments: g.Where(x => x.SourceType == ReferralCommissionMovementSourceType.Payment).Sum(x => x.TotalProfit),
                        Payouts: g.Where(x => x.SourceType == ReferralCommissionMovementSourceType.Payout).Sum(x => x.TotalProfit)
                    ));
        }

        var referredUsers = referredUsersRaw
            .Select(u =>
            {
                var isActive = u.Status == UserStatus.Active;
                var profits = movementProfitsByReferredUserId.GetValueOrDefault(u.Id, (0, 0));
                summaryByReferredUserId.TryGetValue(u.Id, out var summary);

                var eligibleProfitFromPayments = isActive ? profits.Payments : 0;
                var eligibleProfitFromPayouts = isActive ? profits.Payouts : 0;
                var estimatedCommissionFromPayments = isActive ? summary?.TotalCommissionFromPayments ?? 0 : 0;
                var estimatedCommissionFromPayouts = isActive ? summary?.TotalCommissionFromPayouts ?? 0 : 0;

                return new ReferredUserData
                {
                    Id = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    Status = u.Status,
                    ReferredAt = u.ReferredAt,
                    EligibleProfitFromPayments = eligibleProfitFromPayments,
                    EligibleProfitFromPayouts = eligibleProfitFromPayouts,
                    EstimatedCommissionFromPayments = estimatedCommissionFromPayments,
                    EstimatedCommissionFromPayouts = estimatedCommissionFromPayouts,
                    EstimatedCommissionTotal = estimatedCommissionFromPayments + estimatedCommissionFromPayouts
                };
            })
            .ToList();

        var eligibleProfitFromPayments = referredUsers.Sum(u => u.EligibleProfitFromPayments);
        var eligibleProfitFromPayouts = referredUsers.Sum(u => u.EligibleProfitFromPayouts);
        var estimatedCommissionFromPayments = referredUsers.Sum(u => u.EstimatedCommissionFromPayments);
        var estimatedCommissionFromPayouts = referredUsers.Sum(u => u.EstimatedCommissionFromPayouts);
        var estimatedCommissionTotal = estimatedCommissionFromPayments + estimatedCommissionFromPayouts;

        var referralBalance = await dbContext.ReferralCommissionBalances
            .AsNoTracking()
            .OrderBy(b => b.Id)
            .FirstOrDefaultAsync(b => b.ReferrerUserId == user.Id, ct);

        var paidCommissionTotal = referralBalance?.TotalPaid ?? 0;
        var pendingWithdrawalRequestsTotal = referralBalance?.TotalPendingWithdrawal ?? 0;
        var availableCommissionBalance = referralBalance?.AvailableBalance ?? 0;

        var withdrawalIntervalValue = user.ReferralCommissionWithdrawalIntervalValue
            ?? platformReferralSettings?.ReferralCommissionWithdrawalIntervalValue
            ?? 1;
        if (withdrawalIntervalValue < 0)
        {
            withdrawalIntervalValue = 0;
        }

        var withdrawalIntervalUnit = user.ReferralCommissionWithdrawalIntervalUnit
            ?? platformReferralSettings?.ReferralCommissionWithdrawalIntervalUnit
            ?? ReferralWithdrawalIntervalUnit.Days;

        var referralMinWithdrawalAmount = user.ReferralCommissionMinWithdrawalAmount
            ?? platformReferralSettings?.ReferralCommissionMinWithdrawalAmount
            ?? 0;

        var referralWithdrawalFeeFixed = user.ReferralCommissionWithdrawalFeeFixed
            ?? platformReferralSettings?.ReferralCommissionWithdrawalFeeFixed
            ?? 0;

        var lastWithdrawalRequestAt = await dbContext.ReferralCommissionWithdrawalRequests
            .AsNoTracking()
            .Where(r => r.ReferrerUserId == user.Id && r.Status != ReferralCommissionWithdrawalRequestStatus.Cancelled)
            .OrderByDescending(r => r.RequestedAt)
            .Select(r => (DateTime?)r.RequestedAt)
            .FirstOrDefaultAsync(ct);

        var referralStartAt = user.ReferralCodeCreatedAt ?? user.CreatedAt;
        DateTime? nextAllowedWithdrawalRequestAt = null;
        if (withdrawalIntervalValue > 0 && (lastWithdrawalRequestAt.HasValue || !string.IsNullOrWhiteSpace(user.ReferralCode)))
        {
            var cooldownStartAt = lastWithdrawalRequestAt ?? referralStartAt;
            nextAllowedWithdrawalRequestAt = withdrawalIntervalUnit == ReferralWithdrawalIntervalUnit.Months
                ? cooldownStartAt.AddMonths(withdrawalIntervalValue)
                : cooldownStartAt.AddDays(withdrawalIntervalValue);
        }

        var canRequestWithdrawal = availableCommissionBalance > 0
            && availableCommissionBalance >= referralMinWithdrawalAmount
            && availableCommissionBalance > referralWithdrawalFeeFixed
            && user.ReferralPayoutPixKeyType.HasValue
            && !string.IsNullOrWhiteSpace(user.ReferralPayoutPixKey)
            && !string.IsNullOrWhiteSpace(user.ReferralCode)
            && (!nextAllowedWithdrawalRequestAt.HasValue || nextAllowedWithdrawalRequestAt.Value <= DateTime.UtcNow);

        var withdrawalRequests = await dbContext.ReferralCommissionWithdrawalRequests
            .AsNoTracking()
            .Where(r => r.ReferrerUserId == user.Id)
            .OrderByDescending(r => r.RequestedAt)
            .Take(20)
            .Select(r => new ReferralCommissionWithdrawalRequestData
            {
                Id = r.Id,
                Amount = r.Amount,
                FeeAmount = referralWithdrawalFeeFixed,
                NetAmount = Math.Max(r.Amount - referralWithdrawalFeeFixed, 0),
                RequestedAt = r.RequestedAt,
                Status = r.Status,
                Notes = r.Notes,
                ReviewReason = r.ReviewReason
            })
            .ToListAsync(ct);

        var paymentHistoryRaw = await dbContext.ReferralCommissionPayments
            .AsNoTracking()
            .Include(p => p.ReceiptFile)
            .Include(p => p.PaidByUser)
            .Where(p => p.ReferrerUserId == user.Id)
            .OrderByDescending(p => p.PaidAt)
            .ToListAsync(ct);

        var paymentHistory = new List<ReferralCommissionPaymentHistoryData>(paymentHistoryRaw.Count);
        foreach (var payment in paymentHistoryRaw)
        {
            Endpoints.Models.FileData? receiptFile = null;
            if (payment.ReceiptFile != null)
            {
                var receiptUrl = payment.ReceiptFile.IsPublic
                    ? storageService.GetPublicUrl(payment.ReceiptFile.ObjectName)
                    : await storageService.GetPresignedUrlAsync(payment.ReceiptFile.ObjectName, 43200);

                receiptFile = new Endpoints.Models.FileData
                {
                    Id = payment.ReceiptFile.Id,
                    OriginalFileName = payment.ReceiptFile.OriginalFileName,
                    ContentType = payment.ReceiptFile.ContentType,
                    Size = payment.ReceiptFile.Size,
                    Url = receiptUrl,
                    ExpiresAt = payment.ReceiptFile.IsPublic ? null : DateTime.UtcNow.AddHours(12)
                };
            }

            paymentHistory.Add(new ReferralCommissionPaymentHistoryData
            {
                Id = payment.Id,
                Amount = payment.Amount,
                RequestedAmount = payment.RequestedAmount > 0 ? payment.RequestedAmount : payment.Amount,
                FeeAmount = payment.FeeAmount,
                NetAmount = payment.NetAmount > 0 ? payment.NetAmount : Math.Max(payment.Amount - payment.FeeAmount, 0),
                PixKeyType = payment.PixKeyType,
                PixKey = MaskPixKey(payment.PixKey),
                PaidByUserName = payment.PaidByUser?.Name,
                PaidAt = payment.PaidAt,
                Notes = payment.Notes,
                ReceiptFile = receiptFile
            });
        }

        var referralCode = user.ReferralCode?.Trim() ?? string.Empty;
        var baseUrl = platformSettings.Value.BaseUrl.TrimEnd('/');
        var referralLink = string.IsNullOrWhiteSpace(referralCode)
            ? string.Empty
            : $"{baseUrl}/?refCode={Uri.EscapeDataString(referralCode)}";

        await Send.OkAsync(new ReadMyReferralsResponse
        {
            Data = new ReadMyReferralsData
            {
                ReferralCode = referralCode,
                ReferralLink = referralLink,
                ReferralDurationMonths = referralDurationMonths,
                ReferralCommissionPercentage = referralCommissionPercentage,
                EligibleProfitFromPayments = eligibleProfitFromPayments,
                EligibleProfitFromPayouts = eligibleProfitFromPayouts,
                EstimatedCommissionFromPayments = estimatedCommissionFromPayments,
                EstimatedCommissionFromPayouts = estimatedCommissionFromPayouts,
                EstimatedCommissionTotal = estimatedCommissionTotal,
                PaidCommissionTotal = paidCommissionTotal,
                AvailableCommissionBalance = availableCommissionBalance,
                ReferralCommissionWithdrawalIntervalValue = withdrawalIntervalValue,
                ReferralCommissionWithdrawalIntervalUnit = withdrawalIntervalUnit,
                ReferralCommissionMinWithdrawalAmount = referralMinWithdrawalAmount,
                ReferralCommissionWithdrawalFeeFixed = referralWithdrawalFeeFixed,
                ReferralCommissionNextAllowedWithdrawalRequestAt = nextAllowedWithdrawalRequestAt,
                CanRequestReferralCommissionWithdrawal = canRequestWithdrawal,
                PayoutPixKeyType = user.ReferralPayoutPixKeyType,
                PayoutPixKey = MaskPixKey(user.ReferralPayoutPixKey),
                WithdrawalRequests = withdrawalRequests,
                PaymentHistory = paymentHistory,
                ReferredUsers = referredUsers
            }
        }, ct);
    }

    private static string? MaskPixKey(string? pixKey)
    {
        if (string.IsNullOrWhiteSpace(pixKey))
        {
            return null;
        }

        var trimmed = pixKey.Trim();
        if (trimmed.Length <= 6)
        {
            return new string('*', trimmed.Length);
        }

        return $"{trimmed[..3]}{new string('*', trimmed.Length - 6)}{trimmed[^3..]}";
    }
}
