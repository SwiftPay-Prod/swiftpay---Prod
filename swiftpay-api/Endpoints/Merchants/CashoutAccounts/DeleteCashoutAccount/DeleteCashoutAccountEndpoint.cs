using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Merchants.CashoutAccounts.DeleteCashoutAccount;

public sealed class DeleteCashoutAccountEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    INotificationService notificationService
) : Endpoint<DeleteCashoutAccountRequest, DeleteCashoutAccountResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/cashout-accounts/{accountId:guid}/delete");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(DeleteCashoutAccountRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new DeleteCashoutAccountResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new DeleteCashoutAccountResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var payoutAccount = await dbContext.MerchantPayoutAccounts
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync(a => a.Id == req.AccountId && a.MerchantId == req.MerchantId, ct);

        if (payoutAccount == null)
        {
            await Send.ResponseAsync(new DeleteCashoutAccountResponse
            {
                Error = new("Conta de saque não encontrada.")
            }, 404, ct);
            return;
        }

        if (payoutAccount.Status == PayoutAccountStatus.Inactive)
        {
            await Send.ResponseAsync(new DeleteCashoutAccountResponse
            {
                Error = new("Esta conta de saque já foi removida.")
            }, 400, ct);
            return;
        }

        var hasPendingPayouts = await dbContext.Payouts
            .AnyAsync(p => p.MerchantPayoutAccountId == req.AccountId
                && (p.Status == PayoutStatus.Pending || p.Status == PayoutStatus.Processing), ct);

        if (hasPendingPayouts)
        {
            await Send.ResponseAsync(new DeleteCashoutAccountResponse
            {
                Error = new("Não é possível remover esta conta pois há saques pendentes ou em processamento.")
            }, 400, ct);
            return;
        }

        var codeHash = CryptoUtils.ComputeSha256Hash(req.Code);

        var verificationCode = await dbContext.PayoutAccountVerificationCodes
            .Where(c => c.MerchantPayoutAccountId == req.AccountId
                && c.CodeHash == codeHash
                && c.ActionType == PayoutAccountActionType.Delete)
            .OrderByDescending(c => c.CreatedAt)
            .OrderBy(x => x.Id)
            .FirstOrDefaultAsync(ct);

        if (verificationCode == null)
        {
            await securityLog.LogAsync(new SecurityLogInput
            {
                Action = SecurityLogAction.PayoutAccountDeleted,
                Status = SecurityLogStatus.Failed,
                UserId = userId,
                Details = $"Código de verificação inválido para remover conta: {payoutAccount.Id}"
            });

            await Send.ResponseAsync(new DeleteCashoutAccountResponse
            {
                Error = new("Código de verificação inválido.")
            }, 400, ct);
            return;
        }

        if (verificationCode.IsExpired && verificationCode.Status == PayoutAccountVerificationCodeStatus.Pending)
        {
            verificationCode.Status = PayoutAccountVerificationCodeStatus.ExpiredByTime;
            await dbContext.SaveChangesAsync(ct);
        }

        if (!verificationCode.IsValid)
        {
            var message = verificationCode.IsExpired
                ? "Código de verificação expirado. Solicite um novo código."
                : "Código de verificação já utilizado.";

            await securityLog.LogAsync(new SecurityLogInput
            {
                Action = SecurityLogAction.PayoutAccountDeleted,
                Status = SecurityLogStatus.Failed,
                UserId = userId,
                Details = $"Código inválido para remover conta {payoutAccount.Id}: {message}"
            });

            await Send.ResponseAsync(new DeleteCashoutAccountResponse
            {
                Error = new(message)
            }, 400, ct);
            return;
        }

        verificationCode.Status = PayoutAccountVerificationCodeStatus.Used;

        if (payoutAccount.IsDefault)
        {
            var otherActiveAccounts = await dbContext.MerchantPayoutAccounts
                .Where(a => a.MerchantId == req.MerchantId
                    && a.Id != payoutAccount.Id
                    && a.Status == PayoutAccountStatus.Active)
                .ToListAsync(ct);

            if (otherActiveAccounts.Count > 0)
            {
                otherActiveAccounts.First().IsDefault = true;
            }
        }

        payoutAccount.Status = PayoutAccountStatus.Inactive;
        payoutAccount.IsDefault = false;
        payoutAccount.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.PayoutAccountDeleted,
            Status = SecurityLogStatus.Success,
            UserId = userId,
            Details = $"Conta de saque removida: {payoutAccount.Id} para merchant {merchant.Id}"
        });

        _ = notificationService.CreateAsync(
            req.MerchantId,
            NotificationType.Info,
            "Conta de saque removida",
            "Uma conta de saque foi removida da sua organização.",
            NotificationPriority.Normal
        );

        await Send.OkAsync(new DeleteCashoutAccountResponse
        {
            Message = "Conta de saque removida com sucesso."
        }, ct);
    }
}
