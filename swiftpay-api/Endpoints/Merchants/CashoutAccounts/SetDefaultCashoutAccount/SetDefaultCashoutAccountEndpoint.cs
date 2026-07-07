using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Merchants.CashoutAccounts.SetDefaultCashoutAccount;

public sealed class SetDefaultCashoutAccountEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    INotificationService notificationService
) : Endpoint<SetDefaultCashoutAccountRequest, SetDefaultCashoutAccountResponse>
{
    public override void Configure()
    {
        Patch("{merchantId:guid}/cashout-accounts/{accountId:guid}/set-default");
        Group<MerchantGroup>();
        Description(x => x.Accepts<SetDefaultCashoutAccountRequest>());
    }

    public override async Task HandleAsync(SetDefaultCashoutAccountRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new SetDefaultCashoutAccountResponse
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
            await Send.ResponseAsync(new SetDefaultCashoutAccountResponse
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
            await Send.ResponseAsync(new SetDefaultCashoutAccountResponse
            {
                Error = new("Conta de saque não encontrada.")
            }, 404, ct);
            return;
        }

        if (payoutAccount.Status != PayoutAccountStatus.Active)
        {
            await Send.ResponseAsync(new SetDefaultCashoutAccountResponse
            {
                Error = new("Apenas contas ativas podem ser definidas como padrão.")
            }, 400, ct);
            return;
        }

        if (payoutAccount.IsDefault)
        {
            await Send.ResponseAsync(new SetDefaultCashoutAccountResponse
            {
                Error = new("Esta conta já é a conta padrão.")
            }, 400, ct);
            return;
        }

        // Verificar código de autorização
        var codeHash = CryptoUtils.ComputeSha256Hash(req.Code);

        var verificationCode = await dbContext.PayoutAccountVerificationCodes
            .Where(c => c.MerchantPayoutAccountId == req.AccountId
                && c.CodeHash == codeHash
                && c.ActionType == PayoutAccountActionType.SetDefault)
            .OrderByDescending(c => c.CreatedAt)
            .OrderBy(x => x.Id)
            .FirstOrDefaultAsync(ct);

        if (verificationCode == null)
        {
            await securityLog.LogAsync(new SecurityLogInput
            {
                Action = SecurityLogAction.PayoutAccountSetDefault,
                Status = SecurityLogStatus.Failed,
                UserId = userId,
                Details = $"Código de verificação inválido para definir conta padrão: {payoutAccount.Id}"
            });

            await Send.ResponseAsync(new SetDefaultCashoutAccountResponse
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
                Action = SecurityLogAction.PayoutAccountSetDefault,
                Status = SecurityLogStatus.Failed,
                UserId = userId,
                Details = $"Código inválido para definir conta padrão {payoutAccount.Id}: {message}"
            });

            await Send.ResponseAsync(new SetDefaultCashoutAccountResponse
            {
                Error = new(message)
            }, 400, ct);
            return;
        }

        // Marcar código como usado
        verificationCode.Status = PayoutAccountVerificationCodeStatus.Used;

        // Remover flag de padrão de outras contas
        var currentDefaultAccounts = await dbContext.MerchantPayoutAccounts
            .Where(a => a.MerchantId == req.MerchantId && a.IsDefault && a.Id != payoutAccount.Id)
            .ToListAsync(ct);

        foreach (var account in currentDefaultAccounts)
        {
            account.IsDefault = false;
            account.UpdatedAt = DateTime.UtcNow;
        }

        // Definir nova conta padrão
        payoutAccount.IsDefault = true;
        payoutAccount.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.PayoutAccountSetDefault,
            Status = SecurityLogStatus.Success,
            UserId = userId,
            Details = $"Conta de saque definida como padrão: {payoutAccount.Id} para merchant {merchant.Id}"
        });

        _ = notificationService.CreateAsync(
            req.MerchantId,
            NotificationType.Info,
            "Conta de saque padrão alterada",
            $"A conta de saque {MaskUtils.MaskPixKey(payoutAccount.PixKey, payoutAccount.PixKeyType.ToString())} foi definida como padrão.",
            NotificationPriority.Normal
        );

        await Send.OkAsync(new SetDefaultCashoutAccountResponse
        {
            Data = new SetDefaultCashoutAccountData
            {
                Id = payoutAccount.Id,
                PixKeyType = payoutAccount.PixKeyType,
                PixKey = MaskUtils.MaskPixKey(payoutAccount.PixKey, payoutAccount.PixKeyType.ToString()),
                HolderName = payoutAccount.HolderName,
                Status = payoutAccount.Status,
                IsDefault = payoutAccount.IsDefault,
                CreatedAt = payoutAccount.CreatedAt
            },
            Message = "Conta de saque definida como padrão com sucesso."
        }, ct);
    }
}
