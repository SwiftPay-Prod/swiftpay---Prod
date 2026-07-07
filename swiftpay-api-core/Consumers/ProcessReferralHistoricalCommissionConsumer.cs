using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Messages;

namespace swiftpay_api_core.Consumers;

public sealed class ProcessReferralHistoricalCommissionConsumer(
    IServiceScopeFactory scopeFactory,
    ILogger<ProcessReferralHistoricalCommissionConsumer> logger
) : IConsumer<ProcessReferralHistoricalCommissionMessage>
{
    public async Task Consume(ConsumeContext<ProcessReferralHistoricalCommissionMessage> context)
    {
        var msg = context.Message;

        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
        var compilationService = scope.ServiceProvider.GetRequiredService<IReferralCommissionCompilationService>();

        try
        {
            await ProcessAsync(dbContext, compilationService, msg);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Failed to process historical referral commission for referredUser={ReferredUserId} referrer={ReferrerUserId}",
                msg.ReferredUserId,
                msg.ReferrerUserId);
            throw;
        }
    }

    private static async Task ProcessAsync(
        PrimaryDbContext dbContext,
        IReferralCommissionCompilationService compilationService,
        ProcessReferralHistoricalCommissionMessage msg)
    {
        var referrerUser = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == msg.ReferrerUserId);

        if (referrerUser == null)
            return;

        var platformSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .Select(p => new { p.ReferralDurationMonths })
            .FirstOrDefaultAsync();

        var configuredDurationMonths = referrerUser.ReferralDurationMonths
            ?? platformSettings?.ReferralDurationMonths
            ?? 12;

        var durationMonths = configuredDurationMonths > 0 ? configuredDurationMonths : 12;

        var now = DateTime.UtcNow;
        var windowEndAt = msg.ReferredAt.AddMonths(durationMonths);
        var effectiveWindowEndAt = windowEndAt < now ? windowEndAt : now;

        var merchantIds = await dbContext.Merchants
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(m => m.UserId == msg.ReferredUserId)
            .Select(m => m.Id)
            .ToListAsync();

        if (merchantIds.Count == 0)
            return;

        var completedPayments = await dbContext.Payments
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(p => merchantIds.Contains(p.MerchantId)
                     && p.Environment == msg.Environment
                     && p.Status == PaymentStatus.Completed
                     && (p.CompletedAt ?? p.UpdatedAt) >= msg.ReferredAt
                     && (p.CompletedAt ?? p.UpdatedAt) <= effectiveWindowEndAt)
            .Select(p => new
            {
                p.Id,
                p.MerchantId,
                SourceAmount = p.PlatformFee - p.AcquirerFee,
                p.Environment,
                OccurredAt = p.CompletedAt ?? p.UpdatedAt
            })
            .ToListAsync();

        foreach (var payment in completedPayments)
        {
            if (payment.SourceAmount <= 0)
                continue;

            await compilationService.RegisterPaymentCompletedMovementAsync(
                payment.Id,
                payment.MerchantId,
                payment.SourceAmount,
                payment.Environment,
                payment.OccurredAt);
        }

        var completedPayouts = await dbContext.Payouts
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(p => merchantIds.Contains(p.MerchantId)
                     && p.Environment == msg.Environment
                     && p.Status == PayoutStatus.Completed
                     && (p.CompletedAt ?? p.UpdatedAt) >= msg.ReferredAt
                     && (p.CompletedAt ?? p.UpdatedAt) <= effectiveWindowEndAt)
            .Select(p => new
            {
                p.Id,
                p.MerchantId,
                SourceAmount = p.PlatformFee - p.AcquirerFee,
                p.Environment,
                OccurredAt = p.CompletedAt ?? p.UpdatedAt
            })
            .ToListAsync();

        foreach (var payout in completedPayouts)
        {
            if (payout.SourceAmount <= 0)
                continue;

            await compilationService.RegisterPayoutCompletedMovementAsync(
                payout.Id,
                payout.MerchantId,
                payout.SourceAmount,
                payout.Environment,
                payout.OccurredAt);
        }
    }
}
