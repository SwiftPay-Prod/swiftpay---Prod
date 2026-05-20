using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Users.Referrals.CreateReferralCommissionWithdrawalRequest;

public sealed class CreateReferralCommissionWithdrawalRequestEndpoint(
    PrimaryDbContext dbContext,
    INotificationService notificationService,
    IEnvironmentProvider environmentProvider
) : Endpoint<CreateReferralCommissionWithdrawalRequestRequest, CreateReferralCommissionWithdrawalRequestResponse>
{
    public override void Configure()
    {
        Post("referrals/withdrawal-requests");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(CreateReferralCommissionWithdrawalRequestRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreateReferralCommissionWithdrawalRequestResponse
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
            await Send.ResponseAsync(new CreateReferralCommissionWithdrawalRequestResponse
            {
                Error = new("Usuário não encontrado.")
            }, 404, ct);
            return;
        }

        if (!user.ReferralPayoutPixKeyType.HasValue || string.IsNullOrWhiteSpace(user.ReferralPayoutPixKey))
        {
            await Send.ResponseAsync(new CreateReferralCommissionWithdrawalRequestResponse
            {
                Error = new("Cadastre sua chave PIX antes de solicitar o saque da comissão.")
            }, 400, ct);
            return;
        }

        if (string.IsNullOrWhiteSpace(user.ReferralCode))
        {
            await Send.ResponseAsync(new CreateReferralCommissionWithdrawalRequestResponse
            {
                Error = new("Gere seu link de indicação antes de solicitar o saque da comissão.")
            }, 400, ct);
            return;
        }

        var referralBalance = await dbContext.ReferralCommissionBalances
            .OrderBy(b => b.Id)
            .FirstOrDefaultAsync(b => b.ReferrerUserId == user.Id, ct);

        var availableCommissionBalance = referralBalance?.AvailableBalance ?? 0;
        if (availableCommissionBalance <= 0)
        {
            await Send.ResponseAsync(new CreateReferralCommissionWithdrawalRequestResponse
            {
                Error = new("Você não possui saldo disponível para saque de comissão no momento.")
            }, 400, ct);
            return;
        }

        if (req.Amount > availableCommissionBalance)
        {
            await Send.ResponseAsync(new CreateReferralCommissionWithdrawalRequestResponse
            {
                Error = new($"O valor máximo disponível para saque agora é {availableCommissionBalance / 100.0:0.00}.")
            }, 400, ct);
            return;
        }

        var platformSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .Select(p => new
            {
                p.ReferralCommissionWithdrawalIntervalValue,
                p.ReferralCommissionWithdrawalIntervalUnit,
                p.ReferralCommissionMinWithdrawalAmount,
                p.ReferralCommissionWithdrawalFeeFixed,
            })
            .FirstOrDefaultAsync(ct);

        var withdrawalIntervalValue = user.ReferralCommissionWithdrawalIntervalValue
            ?? platformSettings?.ReferralCommissionWithdrawalIntervalValue
            ?? 1;
        if (withdrawalIntervalValue < 0)
        {
            withdrawalIntervalValue = 0;
        }

        var withdrawalIntervalUnit = user.ReferralCommissionWithdrawalIntervalUnit
            ?? platformSettings?.ReferralCommissionWithdrawalIntervalUnit
            ?? ReferralWithdrawalIntervalUnit.Days;

        var minWithdrawalAmount = user.ReferralCommissionMinWithdrawalAmount
            ?? platformSettings?.ReferralCommissionMinWithdrawalAmount
            ?? 0;

        var withdrawalFeeAmount = user.ReferralCommissionWithdrawalFeeFixed
            ?? platformSettings?.ReferralCommissionWithdrawalFeeFixed
            ?? 0;

        if (req.Amount < minWithdrawalAmount)
        {
            await Send.ResponseAsync(new CreateReferralCommissionWithdrawalRequestResponse
            {
                Error = new($"O valor informado está abaixo do mínimo permitido para saque ({minWithdrawalAmount / 100.0:0.00}).")
            }, 400, ct);
            return;
        }

        var netAmount = req.Amount - withdrawalFeeAmount;
        if (netAmount < 1)
        {
            await Send.ResponseAsync(new CreateReferralCommissionWithdrawalRequestResponse
            {
                Error = new("O valor líquido a receber deve ser de no mínimo R$ 0,01.")
            }, 400, ct);
            return;
        }

        var now = DateTime.UtcNow;
        var lastRequestAt = await dbContext.ReferralCommissionWithdrawalRequests
            .AsNoTracking()
            .Where(r => r.ReferrerUserId == user.Id && r.Status != ReferralCommissionWithdrawalRequestStatus.Cancelled)
            .OrderByDescending(r => r.RequestedAt)
            .Select(r => (DateTime?)r.RequestedAt)
            .FirstOrDefaultAsync(ct);

        var referralStartAt = user.ReferralCodeCreatedAt ?? user.CreatedAt;
        var cooldownStartAt = lastRequestAt ?? referralStartAt;
        var hasUnlimitedWithdrawalInterval = withdrawalIntervalValue == 0;
        DateTime? nextAllowedRequestAt = hasUnlimitedWithdrawalInterval
            ? null
            : withdrawalIntervalUnit == ReferralWithdrawalIntervalUnit.Months
                ? cooldownStartAt.AddMonths(withdrawalIntervalValue)
                : cooldownStartAt.AddDays(withdrawalIntervalValue);

        if (nextAllowedRequestAt.HasValue && nextAllowedRequestAt.Value > now)
        {
            await Send.ResponseAsync(new CreateReferralCommissionWithdrawalRequestResponse
            {
                Error = new($"Você deve aguardar até {nextAllowedRequestAt.Value:dd/MM/yyyy HH:mm} para solicitar um novo saque de comissão.")
            }, 400, ct);
            return;
        }

        var withdrawalRequest = new ReferralCommissionWithdrawalRequest
        {
            Id = Guid.CreateVersion7(),
            ReferrerUserId = user.Id,
            Amount = req.Amount,
            RequestedAt = now,
            Status = ReferralCommissionWithdrawalRequestStatus.Requested,
            Notes = string.IsNullOrWhiteSpace(req.Notes) ? null : req.Notes.Trim(),
            ReviewReason = null
        };

        referralBalance ??= new ReferralCommissionBalance
        {
            Id = Guid.CreateVersion7(),
            ReferrerUserId = user.Id,
            Environment = environmentProvider.CurrentEnvironment,
            AvailableBalance = 0,
            TotalGenerated = 0,
            TotalPaid = 0,
            TotalPendingWithdrawal = 0
        };

        referralBalance.AvailableBalance = Math.Max(0, referralBalance.AvailableBalance - req.Amount);
        referralBalance.TotalPendingWithdrawal += req.Amount;

        if (dbContext.Entry(referralBalance).State == EntityState.Detached)
        {
            dbContext.ReferralCommissionBalances.Add(referralBalance);
        }

        dbContext.ReferralCommissionWithdrawalRequests.Add(withdrawalRequest);
        await dbContext.SaveChangesAsync(ct);

        await notificationService.CreateUserInfoNotificationAsync(
            user.Id,
            "Solicitação de saque de comissão enviada",
            "Recebemos sua solicitação de saque de comissão. O time administrativo irá analisar em breve.",
            actionUrl: "/panel/referrals");

        await Send.OkAsync(new CreateReferralCommissionWithdrawalRequestResponse
        {
            Data = new ReferralCommissionWithdrawalRequestData
            {
                Id = withdrawalRequest.Id,
                Amount = withdrawalRequest.Amount,
                FeeAmount = withdrawalFeeAmount,
                NetAmount = netAmount,
                RequestedAt = withdrawalRequest.RequestedAt,
                NextAllowedRequestAt = hasUnlimitedWithdrawalInterval
                    ? withdrawalRequest.RequestedAt
                    : withdrawalIntervalUnit == ReferralWithdrawalIntervalUnit.Months
                        ? withdrawalRequest.RequestedAt.AddMonths(withdrawalIntervalValue)
                        : withdrawalRequest.RequestedAt.AddDays(withdrawalIntervalValue),
                WithdrawalIntervalValue = withdrawalIntervalValue,
                WithdrawalIntervalUnit = withdrawalIntervalUnit,
                MinWithdrawalAmount = minWithdrawalAmount,
                Notes = withdrawalRequest.Notes,
                Status = withdrawalRequest.Status
            },
            Message = "Solicitação de saque de comissão enviada com sucesso."
        }, ct);
    }
}
