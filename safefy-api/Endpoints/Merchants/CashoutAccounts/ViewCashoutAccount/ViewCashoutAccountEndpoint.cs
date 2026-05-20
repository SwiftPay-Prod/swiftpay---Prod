using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Models.Database;
using safefy_api.Mappers;

namespace safefy_api.Endpoints.Merchants.CashoutAccounts.ViewCashoutAccount;

public sealed class ViewCashoutAccountEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ViewCashoutAccountRequest, ViewCashoutAccountResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/cashout-accounts/{accountId:guid}/view");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ViewCashoutAccountRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ViewCashoutAccountResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var isAdmin = EndpointUtils.IsAdmin(User);
        var merchant = isAdmin
            ? await dbContext.Merchants.OrderBy(m => m.Id).FirstOrDefaultAsync(m => m.Id == req.MerchantId, ct)
            : await dbContext.Merchants.OrderBy(m => m.Id).FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ViewCashoutAccountResponse
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
            await Send.ResponseAsync(new ViewCashoutAccountResponse
            {
                Error = new("Conta de saque não encontrada.")
            }, 404, ct);
            return;
        }

        if (isAdmin)
        {
            await Send.OkAsync(new ViewCashoutAccountResponse
            {
                Data = CashoutAccountMapper.ToViewData(payoutAccount)
            }, ct);
            return;
        }

        var codeHash = CryptoUtils.ComputeSha256Hash(req.Code);

        var verificationCode = await dbContext.PayoutAccountVerificationCodes
            .Where(c => c.MerchantPayoutAccountId == req.AccountId
                && c.ActionType == PayoutAccountActionType.View
                && c.CodeHash == codeHash
                && c.Status == PayoutAccountVerificationCodeStatus.Pending)
            .OrderBy(x => x.Id)
            .FirstOrDefaultAsync(ct);

        if (verificationCode == null)
        {
            await Send.ResponseAsync(new ViewCashoutAccountResponse
            {
                Error = new("Código de verificação inválido.")
            }, 400, ct);
            return;
        }

        if (verificationCode.IsExpired)
        {
            verificationCode.Status = PayoutAccountVerificationCodeStatus.ExpiredByTime;
            await dbContext.SaveChangesAsync(ct);

            await Send.ResponseAsync(new ViewCashoutAccountResponse
            {
                Error = new("O código expirou. Solicite um novo código.")
            }, 400, ct);
            return;
        }

        verificationCode.Status = PayoutAccountVerificationCodeStatus.Used;
        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new ViewCashoutAccountResponse
        {
            Data = CashoutAccountMapper.ToViewData(payoutAccount)
        }, ct);
    }
}
