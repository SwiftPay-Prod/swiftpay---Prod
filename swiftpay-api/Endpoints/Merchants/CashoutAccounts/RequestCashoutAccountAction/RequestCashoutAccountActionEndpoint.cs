using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Email;
using safefy_api_core.Models.Settings;
using safefy_api_core.Interfaces;

namespace safefy_api.Endpoints.Merchants.CashoutAccounts.RequestCashoutAccountAction;

public sealed class RequestCashoutAccountActionEndpoint(
    PrimaryDbContext dbContext,
    IGeoLocationService geoLocationService,
    IEmailService emailService,
    IOptions<PlatformSettingsOptions> platformSettings
) : Endpoint<RequestCashoutAccountActionRequest, RequestCashoutAccountActionResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/cashout-accounts/{accountId:guid}/request-action");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(RequestCashoutAccountActionRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new RequestCashoutAccountActionResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var ipAddress = EndpointUtils.GetIpAddress(HttpContext);
        var geoLocation = await geoLocationService.GetLocationAsync(ipAddress);
        var location = geoLocation.DisplayLocation;

        var merchant = await dbContext.Merchants
            .Include(m => m.User)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new RequestCashoutAccountActionResponse
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
            await Send.ResponseAsync(new RequestCashoutAccountActionResponse
            {
                Error = new("Conta de saque não encontrada.")
            }, 404, ct);
            return;
        }

        if (req.ActionType == PayoutAccountActionType.SetDefault)
        {
            if (payoutAccount.Status != PayoutAccountStatus.Active)
            {
                await Send.ResponseAsync(new RequestCashoutAccountActionResponse
                {
                    Error = new("Apenas contas ativas podem ser definidas como padrão.")
                }, 400, ct);
                return;
            }

            if (payoutAccount.IsDefault)
            {
                await Send.ResponseAsync(new RequestCashoutAccountActionResponse
                {
                    Error = new("Esta conta já é a conta padrão.")
                }, 400, ct);
                return;
            }
        }

        if (req.ActionType == PayoutAccountActionType.Delete)
        {
            if (payoutAccount.Status == PayoutAccountStatus.Inactive)
            {
                await Send.ResponseAsync(new RequestCashoutAccountActionResponse
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
                await Send.ResponseAsync(new RequestCashoutAccountActionResponse
                {
                    Error = new("Não é possível remover esta conta pois há saques pendentes ou em processamento.")
                }, 400, ct);
                return;
            }
        }

        // Invalidar códigos anteriores do mesmo tipo
        var pendingCodes = await dbContext.PayoutAccountVerificationCodes
            .Where(c => c.MerchantPayoutAccountId == req.AccountId
                && c.ActionType == req.ActionType
                && c.Status == PayoutAccountVerificationCodeStatus.Pending)
            .ToListAsync(ct);

        foreach (var pendingCode in pendingCodes)
        {
            pendingCode.Status = PayoutAccountVerificationCodeStatus.ExpiredByNewCode;
        }

        // Gerar novo código
        var code = CryptoUtils.GenerateCode();
        var codeHash = CryptoUtils.ComputeSha256Hash(code);
        var expirationMinutes = platformSettings.Value.VerificationCodeExpirationMinutes;

        var verificationCode = new PayoutAccountVerificationCode
        {
            Id = Guid.CreateVersion7(),
            MerchantPayoutAccountId = payoutAccount.Id,
            UserId = userId.Value,
            CodeHash = codeHash,
            ActionType = req.ActionType,
            Status = PayoutAccountVerificationCodeStatus.Pending,
            ExpiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes)
        };

        dbContext.PayoutAccountVerificationCodes.Add(verificationCode);
        await dbContext.SaveChangesAsync(ct);

        var user = merchant.User;
        var now = DateTime.UtcNow;
        var brazilTimeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
        var brazilTime = TimeZoneInfo.ConvertTimeFromUtc(now, brazilTimeZone);

        var (emailSubject, actionDescription) = GetEmailContent(req.ActionType);

        _ = emailService.SendAsync(
            user.Email,
            emailSubject,
            EmailTemplate.PayoutAccountActionVerification,
            new Dictionary<string, string>
            {
                { "NAME", user.Name },
                { "MERCHANT_NAME", merchant.Name ?? "Sua organização" },
                { "ACTION_DESCRIPTION", actionDescription },
                { "PIX_KEY_TYPE", GetPixKeyTypeDisplayName(payoutAccount.PixKeyType) },
                { "PIX_KEY", MaskUtils.MaskPixKey(payoutAccount.PixKey, payoutAccount.PixKeyType.ToString()) },
                { "CODE", code },
                { "EXPIRES_IN", expirationMinutes.ToString() },
                { "DATE", brazilTime.ToString("dd/MM/yyyy") },
                { "TIME", brazilTime.ToString("HH:mm:ss") },
                { "IP_ADDRESS", ipAddress },
                { "LOCATION", location }
            },
            userId: user.Id,
            merchantId: merchant.Id
        );

        await Send.OkAsync(new RequestCashoutAccountActionResponse
        {
            Data = new RequestCashoutAccountActionData
            {
                AccountId = payoutAccount.Id,
                ActionType = req.ActionType,
                ExpiresInMinutes = expirationMinutes
            },
            Message = "Código de verificação enviado para seu e-mail."
        }, ct);
    }

    private static (string Subject, string Description) GetEmailContent(PayoutAccountActionType actionType) => actionType switch
    {
        PayoutAccountActionType.SetDefault => ("🔐 Confirme a Alteração de Conta Padrão - Safefy", "definir esta conta como padrão para saques"),
        PayoutAccountActionType.Delete => ("🔐 Confirme a Remoção de Conta de Saque - Safefy", "remover esta conta de saque"),
        PayoutAccountActionType.View => ("🔐 Confirme a Visualização de Dados - Safefy", "visualizar os dados completos desta conta de saque"),
        _ => ("🔐 Código de Verificação - Safefy", "realizar esta ação")
    };

    private static string GetPixKeyTypeDisplayName(PixKeyType keyType) => keyType switch
    {
        PixKeyType.Cpf => "CPF",
        PixKeyType.Cnpj => "CNPJ",
        PixKeyType.Email => "E-mail",
        PixKeyType.Phone => "Telefone",
        PixKeyType.Random => "Chave Aleatória",
        _ => keyType.ToString()
    };
}
