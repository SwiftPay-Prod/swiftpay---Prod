using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Admin.Referrals.EvaluateReferralCommissionWithdrawalRequest;

public sealed class EvaluateReferralCommissionWithdrawalRequestEndpoint(
    PrimaryDbContext dbContext,
    ILedgerService ledgerService,
    INotificationService notificationService,
    IEnvironmentProvider environmentProvider
) : Endpoint<EvaluateReferralCommissionWithdrawalRequestRequest, EvaluateReferralCommissionWithdrawalRequestResponse>
{
    public override void Configure()
    {
        Post("referrals/withdrawal-requests/{requestId:guid}/evaluate");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(EvaluateReferralCommissionWithdrawalRequestRequest req, CancellationToken ct)
    {
        var actorUserId = EndpointUtils.GetUserId(User);
        if (actorUserId == null)
        {
            await Send.ResponseAsync(new EvaluateReferralCommissionWithdrawalRequestResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var withdrawalRequest = await dbContext.ReferralCommissionWithdrawalRequests
            .Include(r => r.ReferrerUser)
            .OrderBy(r => r.Id)
            .FirstOrDefaultAsync(r => r.Id == req.RequestId, ct);

        if (withdrawalRequest == null)
        {
            await Send.ResponseAsync(new EvaluateReferralCommissionWithdrawalRequestResponse
            {
                Error = new("Solicitação de saque não encontrada.")
            }, 404, ct);
            return;
        }

        if (withdrawalRequest.Status != ReferralCommissionWithdrawalRequestStatus.Requested)
        {
            await Send.ResponseAsync(new EvaluateReferralCommissionWithdrawalRequestResponse
            {
                Error = new("A solicitação já foi analisada e não pode ser avaliada novamente.")
            }, 400, ct);
            return;
        }

        if (req.Status == ReferralCommissionWithdrawalEvaluateStatus.Reviewed)
        {
            await HandleMarkAsPaidAsync(req, withdrawalRequest, actorUserId.Value, ct);
            return;
        }

        await HandleRejectAsync(req, withdrawalRequest, ct);
    }

    private async Task HandleMarkAsPaidAsync(
        EvaluateReferralCommissionWithdrawalRequestRequest req,
        ReferralCommissionWithdrawalRequest withdrawalRequest,
        Guid actorUserId,
        CancellationToken ct)
    {
        var user = withdrawalRequest.ReferrerUser;
        if (!user.ReferralPayoutPixKeyType.HasValue || string.IsNullOrWhiteSpace(user.ReferralPayoutPixKey))
        {
            await Send.ResponseAsync(new EvaluateReferralCommissionWithdrawalRequestResponse
            {
                Error = new("O usuário não possui chave PIX cadastrada para recebimento da comissão.")
            }, 400, ct);
            return;
        }

        var referralBalance = await dbContext.ReferralCommissionBalances
            .OrderBy(b => b.Id)
            .FirstOrDefaultAsync(b => b.ReferrerUserId == user.Id, ct);

        var platformReferralSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .Select(p => new
            {
                p.ReferralCommissionWithdrawalFeeFixed,
            })
            .FirstOrDefaultAsync(ct);

        var withdrawalFeeFixed = user.ReferralCommissionWithdrawalFeeFixed
            ?? platformReferralSettings?.ReferralCommissionWithdrawalFeeFixed
            ?? 0;

        var paidAmount = req.Amount ?? 0;
        if (paidAmount - withdrawalFeeFixed < 1)
        {
            await Send.ResponseAsync(new EvaluateReferralCommissionWithdrawalRequestResponse
            {
                Error = new("O valor líquido a pagar deve ser de no mínimo R$ 0,01.")
            }, 400, ct);
            return;
        }

        var availableCommissionBalance = referralBalance?.AvailableBalance ?? 0;
        var maxPayableAmount = availableCommissionBalance + withdrawalRequest.Amount;
        if (paidAmount > maxPayableAmount)
        {
            await Send.ResponseAsync(new EvaluateReferralCommissionWithdrawalRequestResponse
            {
                Error = new("O valor informado é maior que o limite disponível para esta solicitação.")
            }, 400, ct);
            return;
        }

        StoredFile? receiptFileEntity = null;
        if (req.ReceiptFileId.HasValue)
        {
            receiptFileEntity = await dbContext.StoredFiles
                .OrderBy(f => f.Id)
                .FirstOrDefaultAsync(f => f.Id == req.ReceiptFileId.Value, ct);

            if (receiptFileEntity == null)
            {
                await Send.ResponseAsync(new EvaluateReferralCommissionWithdrawalRequestResponse
                {
                    Error = new("Comprovante informado não foi encontrado.")
                }, 400, ct);
                return;
            }
        }

        var ledgerResult = await ledgerService.RecordReferralCommissionPayoutAsync(
            paidAmount,
            $"Pagamento de comissão de indicação (solicitação {withdrawalRequest.Id})");

        if (!ledgerResult.Success)
        {
            await Send.ResponseAsync(new EvaluateReferralCommissionWithdrawalRequestResponse
            {
                Error = new(ledgerResult.ErrorMessage ?? "Não foi possível registrar o pagamento da comissão no ledger.")
            }, 400, ct);
            return;
        }

        var ledgerTransactionId = string.IsNullOrWhiteSpace(ledgerResult.TransactionId)
            ? null
            : ledgerResult.TransactionId;

        var payment = new ReferralCommissionPayment
        {
            Id = Guid.CreateVersion7(),
            ReferrerUserId = user.Id,
            PaidByUserId = actorUserId,
            WithdrawalRequestId = withdrawalRequest.Id,
            Amount = paidAmount,
            RequestedAmount = withdrawalRequest.Amount,
            FeeAmount = withdrawalFeeFixed,
            NetAmount = Math.Max(paidAmount - withdrawalFeeFixed, 0),
            PixKeyType = user.ReferralPayoutPixKeyType,
            PixKey = user.ReferralPayoutPixKey,
            Notes = string.IsNullOrWhiteSpace(req.Notes) ? null : req.Notes.Trim(),
            LedgerTransactionId = ledgerTransactionId,
            PaidAt = DateTime.UtcNow,
            ReceiptFileId = receiptFileEntity?.Id,
            ReceiptFile = receiptFileEntity
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

        var requestedAmount = withdrawalRequest.Amount;
        referralBalance.TotalPendingWithdrawal = Math.Max(0, referralBalance.TotalPendingWithdrawal - requestedAmount);
        referralBalance.TotalPaid += paidAmount;
        referralBalance.AvailableBalance = Math.Max(0, referralBalance.AvailableBalance + (requestedAmount - paidAmount));

        withdrawalRequest.Status = ReferralCommissionWithdrawalRequestStatus.Reviewed;
        withdrawalRequest.ReviewReason = null;

        if (dbContext.Entry(referralBalance).State == EntityState.Detached)
        {
            dbContext.ReferralCommissionBalances.Add(referralBalance);
        }

        dbContext.ReferralCommissionPayments.Add(payment);
        await dbContext.SaveChangesAsync(ct);

        await notificationService.CreateUserInfoNotificationAsync(
            user.Id,
            "Comissão de indicação paga",
            $"Seu saque de comissão foi pago no valor de R$ {(paidAmount / 100m):N2}.",
            actionUrl: "/panel/referrals");

        await Send.OkAsync(new EvaluateReferralCommissionWithdrawalRequestResponse
        {
            Data = new EvaluateReferralCommissionWithdrawalRequestData
            {
                RequestId = withdrawalRequest.Id,
                ReferrerUserId = user.Id,
                Status = withdrawalRequest.Status,
                PaymentId = payment.Id,
                PaidAmount = paidAmount,
                ReleasedAmount = Math.Max(requestedAmount - paidAmount, 0),
                AvailableCommissionBalance = referralBalance.AvailableBalance,
                PendingWithdrawalRequestsTotal = referralBalance.TotalPendingWithdrawal,
                Reason = null
            },
            Message = "Pagamento de comissão registrado com sucesso."
        }, ct);
    }

    private async Task HandleRejectAsync(
        EvaluateReferralCommissionWithdrawalRequestRequest req,
        ReferralCommissionWithdrawalRequest withdrawalRequest,
        CancellationToken ct)
    {
        var referralBalance = await dbContext.ReferralCommissionBalances
            .OrderBy(b => b.Id)
            .FirstOrDefaultAsync(b => b.ReferrerUserId == withdrawalRequest.ReferrerUserId, ct);

        referralBalance ??= new ReferralCommissionBalance
        {
            Id = Guid.CreateVersion7(),
            ReferrerUserId = withdrawalRequest.ReferrerUserId,
            Environment = environmentProvider.CurrentEnvironment,
            AvailableBalance = 0,
            TotalGenerated = 0,
            TotalPaid = 0,
            TotalPendingWithdrawal = 0
        };

        var reason = req.Reason?.Trim() ?? string.Empty;
        var releasedAmount = withdrawalRequest.Amount;
        referralBalance.TotalPendingWithdrawal = Math.Max(0, referralBalance.TotalPendingWithdrawal - releasedAmount);
        referralBalance.AvailableBalance += releasedAmount;

        withdrawalRequest.Status = ReferralCommissionWithdrawalRequestStatus.Cancelled;
        withdrawalRequest.ReviewReason = reason;

        if (dbContext.Entry(referralBalance).State == EntityState.Detached)
        {
            dbContext.ReferralCommissionBalances.Add(referralBalance);
        }

        await dbContext.SaveChangesAsync(ct);

        await notificationService.CreateUserNotificationAsync(
            withdrawalRequest.ReferrerUserId,
            NotificationType.Warning,
            "Solicitação de saque rejeitada",
            $"Sua solicitação de saque de comissão foi rejeitada. Motivo: {withdrawalRequest.ReviewReason}",
            NotificationPriority.High,
            actionUrl: "/panel/referrals");

        await Send.OkAsync(new EvaluateReferralCommissionWithdrawalRequestResponse
        {
            Data = new EvaluateReferralCommissionWithdrawalRequestData
            {
                RequestId = withdrawalRequest.Id,
                ReferrerUserId = withdrawalRequest.ReferrerUserId,
                Status = withdrawalRequest.Status,
                PaymentId = null,
                PaidAmount = 0,
                ReleasedAmount = releasedAmount,
                AvailableCommissionBalance = referralBalance.AvailableBalance,
                PendingWithdrawalRequestsTotal = referralBalance.TotalPendingWithdrawal,
                Reason = withdrawalRequest.ReviewReason
            },
            Message = "Solicitação rejeitada com sucesso."
        }, ct);
    }
}
