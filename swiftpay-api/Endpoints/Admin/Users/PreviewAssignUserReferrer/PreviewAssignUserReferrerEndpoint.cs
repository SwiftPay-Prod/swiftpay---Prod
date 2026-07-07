using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Admin.Users.PreviewAssignUserReferrer;

public sealed class PreviewAssignUserReferrerEndpoint(
    PrimaryDbContext dbContext,
    ICalculationService calculationService
) : Endpoint<PreviewAssignUserReferrerRequest, PreviewAssignUserReferrerResponse>
{
    public override void Configure()
    {
        Post("users/{userId:guid}/assign-referrer/preview");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(PreviewAssignUserReferrerRequest req, CancellationToken ct)
    {
        var referredUser = await dbContext.Users
            .AsNoTracking()
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == req.UserId, ct);

        if (referredUser == null)
        {
            await Send.ResponseAsync(new PreviewAssignUserReferrerResponse
            {
                Error = new("Usuário indicado não encontrado.")
            }, 404, ct);
            return;
        }

        var referrerUser = await dbContext.Users
            .AsNoTracking()
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == req.ReferrerUserId, ct);

        if (referrerUser == null)
        {
            await Send.ResponseAsync(new PreviewAssignUserReferrerResponse
            {
                Error = new("Gerente de contas não encontrado.")
            }, 404, ct);
            return;
        }

        if (referrerUser.Status != UserStatus.Active)
        {
            await Send.ResponseAsync(new PreviewAssignUserReferrerResponse
            {
                Error = new("Somente usuários ativos podem ser vinculados como gerente de contas.")
            }, 400, ct);
            return;
        }

        if (referrerUser.ReferredByUserId.HasValue)
        {
            await Send.ResponseAsync(new PreviewAssignUserReferrerResponse
            {
                Error = new("Um usuário já indicado não pode ser definido como gerente de contas de outro usuário.")
            }, 400, ct);
            return;
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

        var referredAt = referredUser.CreatedAt;
        var configuredDurationMonths = referrerUser.ReferralDurationMonths
            ?? platformReferralSettings?.ReferralDurationMonths
            ?? 12;

        var configuredReferralCommissionPercentage = referrerUser.ReferralCommissionPercentage
            ?? platformReferralSettings?.ReferralCommissionPercentage
            ?? 1000;

        var durationMonths = configuredDurationMonths > 0 ? configuredDurationMonths : 12;
        var referralCommissionPercentage = configuredReferralCommissionPercentage > 0 ? configuredReferralCommissionPercentage : 1000;

        var now = DateTime.UtcNow;
        var windowEndAt = referredAt.AddMonths(durationMonths);
        var effectiveWindowEndAt = windowEndAt < now ? windowEndAt : now;

        var merchantIds = await dbContext.Merchants
            .AsNoTracking()
            .Where(m => m.UserId == referredUser.Id)
            .Select(m => m.Id)
            .ToListAsync(ct);

        var eligiblePaymentsCount = 0;
        var eligiblePayoutsCount = 0;
        var eligibleProfitFromPayments = 0L;
        var eligibleProfitFromPayouts = 0L;
        var paymentProfits = new List<long>();
        var payoutProfits = new List<long>();

        if (merchantIds.Count > 0)
        {
            paymentProfits = await dbContext.Payments
                .AsNoTracking()
                .Where(p => merchantIds.Contains(p.MerchantId)
                         && p.Status == PaymentStatus.Completed
                         && (p.CompletedAt ?? p.UpdatedAt) >= referredAt
                         && (p.CompletedAt ?? p.UpdatedAt) <= effectiveWindowEndAt)
                .Select(p => (p.PlatformFee + p.CheckoutTemplateFee) - p.AcquirerFee)
                .ToListAsync(ct);

            payoutProfits = await dbContext.Payouts
                .AsNoTracking()
                .Where(p => merchantIds.Contains(p.MerchantId)
                         && p.Status == PayoutStatus.Completed
                         && (p.CompletedAt ?? p.UpdatedAt) >= referredAt
                         && (p.CompletedAt ?? p.UpdatedAt) <= effectiveWindowEndAt)
                .Select(p => p.PlatformFee - p.AcquirerFee)
                .ToListAsync(ct);

            eligiblePaymentsCount = paymentProfits.Count(x => x > 0);
            eligiblePayoutsCount = payoutProfits.Count(x => x > 0);
            eligibleProfitFromPayments = paymentProfits.Where(x => x > 0).Sum();
            eligibleProfitFromPayouts = payoutProfits.Where(x => x > 0).Sum();
        }

        var (estimatedCommissionFromPayments, estimatedCommissionFromPayouts, estimatedCommissionTotal) =
            calculationService.CalculateEstimatedReferralCommissionTotalFromMovements(
                paymentProfits,
                payoutProfits,
                referralCommissionPercentage);

        await Send.OkAsync(new PreviewAssignUserReferrerResponse
        {
            Data = new PreviewAssignUserReferrerData
            {
                UserId = referredUser.Id,
                ReferrerUserId = referrerUser.Id,
                ReferredAt = referredAt,
                ReferralWindowEndAt = effectiveWindowEndAt,
                ReferralCommissionPercentage = referralCommissionPercentage,
                EligiblePaymentsCount = eligiblePaymentsCount,
                EligiblePayoutsCount = eligiblePayoutsCount,
                EligibleProfitFromPayments = eligibleProfitFromPayments,
                EligibleProfitFromPayouts = eligibleProfitFromPayouts,
                EstimatedCommissionFromPayments = estimatedCommissionFromPayments,
                EstimatedCommissionFromPayouts = estimatedCommissionFromPayouts,
                EstimatedCommissionTotal = estimatedCommissionTotal
            }
        }, ct);
    }
}
