using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;
using safefy_api.Services.Internal;
using safefy_api_core.Models.UserOnboarding;

namespace safefy_api.Endpoints.Admin.Users.ReadUser;

public sealed class ReadUserEndpoint(
    PrimaryDbContext dbContext,
    ReferralCommissionCalculator referralCommissionCalculator
) : Endpoint<ReadUserRequest, ReadUserResponse>
{
    public override void Configure()
    {
        Get("users/{userId:guid}");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadUserRequest req, CancellationToken ct)
    {
        var user = await dbContext.Users
            .AsNoTracking()
            .Include(u => u.ReferredByUser)
            .Include(u => u.Merchants)
                .ThenInclude(m => m.MerchantKyc)
            .Include(u => u.Merchants)
                .ThenInclude(m => m.Payments)
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == req.UserId, ct);

        if (user == null)
        {
            await Send.ResponseAsync(new ReadUserResponse
            {
                Error = new("Usuário não encontrado.")
            }, 404, ct);
            return;
        }

        var merchants = user.Merchants
            .Where(m => m.Status != safefy_api_core.Models.Database.MerchantStatus.Deleted)
            .Select(UserMapper.ToAdminMerchantSummary)
            .ToList();

        var summary = await referralCommissionCalculator.CalculateForReferrerAsync(user.Id, ct);

        var paymentHistory = await dbContext.ReferralCommissionPayments
            .AsNoTracking()
            .Where(p => p.ReferrerUserId == user.Id)
            .Join(
                dbContext.Users.AsNoTracking(),
                p => p.PaidByUserId,
                actor => actor.Id,
                (p, actor) => new AdminReferralCommissionPaymentHistoryData
                {
                    Id = p.Id,
                    Amount = p.Amount,
                    PaidAt = p.PaidAt,
                    PaidByUserId = p.PaidByUserId,
                    PaidByUserName = actor.Name,
                    Notes = p.Notes,
                    PixKeyType = p.PixKeyType,
                    PixKey = p.PixKey
                })
            .OrderByDescending(p => p.PaidAt)
            .ToListAsync(ct);

        var paidCommissionTotal = paymentHistory.Sum(p => p.Amount);
        var availableCommissionBalance = Math.Max(summary.EstimatedCommissionTotal - paidCommissionTotal, 0);

        var referralCommission = new AdminReferralCommissionSummaryData
        {
            EstimatedCommissionTotal = summary.EstimatedCommissionTotal,
            PaidCommissionTotal = paidCommissionTotal,
            AvailableCommissionBalance = availableCommissionBalance,
            PaymentHistory = paymentHistory
        };

        var onboardingConfig = UserOnboardingConfigSerializer.ParseOrDefault(user.UserOnboardingDataJson);
        var onboarding = new AdminUserOnboardingData
        {
            Completed = user.UserOnboardingCompleted,
            CompletedAt = user.UserOnboardingCompletedAt,
            Discovery = onboardingConfig.Discovery,
            DiscoveryOther = onboardingConfig.DiscoveryOther,
            Channels = onboardingConfig.Channels,
            ChannelsOther = onboardingConfig.ChannelsOther,
            Goals = onboardingConfig.Goals,
            GoalsOther = onboardingConfig.GoalsOther,
        };

        await Send.OkAsync(new ReadUserResponse
        {
            Data = UserMapper.ToAdminUserDetails(user, merchants, referralCommission, onboarding)
        }, ct);
    }
}
