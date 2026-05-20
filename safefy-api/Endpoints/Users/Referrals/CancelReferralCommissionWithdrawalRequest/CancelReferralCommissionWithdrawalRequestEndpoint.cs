using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Users.Referrals.CancelReferralCommissionWithdrawalRequest;

public sealed class CancelReferralCommissionWithdrawalRequestEndpoint(
    PrimaryDbContext dbContext,
    INotificationService notificationService,
    IEnvironmentProvider environmentProvider
) : Endpoint<CancelReferralCommissionWithdrawalRequestRequest, CancelReferralCommissionWithdrawalRequestResponse>
{
    public override void Configure()
    {
        Patch("referrals/withdrawal-requests/{requestId:guid}/cancel");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(CancelReferralCommissionWithdrawalRequestRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CancelReferralCommissionWithdrawalRequestResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var withdrawalRequest = await dbContext.ReferralCommissionWithdrawalRequests
            .OrderBy(r => r.Id)
            .FirstOrDefaultAsync(r => r.Id == req.RequestId && r.ReferrerUserId == userId, ct);

        if (withdrawalRequest == null)
        {
            await Send.ResponseAsync(new CancelReferralCommissionWithdrawalRequestResponse
            {
                Error = new("Solicitação de saque não encontrada.")
            }, 404, ct);
            return;
        }

        if (withdrawalRequest.Status != ReferralCommissionWithdrawalRequestStatus.Requested)
        {
            await Send.ResponseAsync(new CancelReferralCommissionWithdrawalRequestResponse
            {
                Error = new("Somente solicitações pendentes podem ser canceladas.")
            }, 400, ct);
            return;
        }

        var referralBalance = await dbContext.ReferralCommissionBalances
            .OrderBy(b => b.Id)
            .FirstOrDefaultAsync(b => b.ReferrerUserId == userId, ct);

        referralBalance ??= new ReferralCommissionBalance
        {
            Id = Guid.CreateVersion7(),
            ReferrerUserId = userId.Value,
            Environment = environmentProvider.CurrentEnvironment,
            AvailableBalance = 0,
            TotalGenerated = 0,
            TotalPaid = 0,
            TotalPendingWithdrawal = 0
        };

        var releasedAmount = withdrawalRequest.Amount;
        referralBalance.TotalPendingWithdrawal = Math.Max(0, referralBalance.TotalPendingWithdrawal - releasedAmount);
        referralBalance.AvailableBalance += releasedAmount;

        withdrawalRequest.Status = ReferralCommissionWithdrawalRequestStatus.Cancelled;
        withdrawalRequest.ReviewReason = "Solicitação cancelada pelo usuário.";

        if (dbContext.Entry(referralBalance).State == EntityState.Detached)
        {
            dbContext.ReferralCommissionBalances.Add(referralBalance);
        }

        await dbContext.SaveChangesAsync(ct);

        await notificationService.CreateUserInfoNotificationAsync(
            userId.Value,
            "Solicitação de saque cancelada",
            "Sua solicitação foi cancelada e o valor voltou para seu saldo disponível.",
            actionUrl: "/panel/referrals");

        await Send.OkAsync(new CancelReferralCommissionWithdrawalRequestResponse
        {
            Data = new CancelReferralCommissionWithdrawalRequestData
            {
                RequestId = withdrawalRequest.Id,
                Status = withdrawalRequest.Status,
                ReleasedAmount = releasedAmount,
                AvailableCommissionBalance = referralBalance.AvailableBalance,
                PendingWithdrawalRequestsTotal = referralBalance.TotalPendingWithdrawal
            },
            Message = "Solicitação cancelada com sucesso."
        }, ct);
    }
}
