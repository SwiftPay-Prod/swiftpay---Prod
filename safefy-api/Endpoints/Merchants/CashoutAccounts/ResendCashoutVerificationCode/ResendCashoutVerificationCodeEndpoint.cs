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

namespace safefy_api.Endpoints.Merchants.CashoutAccounts.ResendCashoutVerificationCode;

public sealed class ResendCashoutVerificationCodeEndpoint(
    PrimaryDbContext dbContext,
    IGeoLocationService geoLocationService,
    IEmailService emailService,
    IOptions<PlatformSettingsOptions> platformSettings
) : Endpoint<ResendCashoutVerificationCodeRequest, ResendCashoutVerificationCodeResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/cashout-accounts/{accountId:guid}/resend-code");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ResendCashoutVerificationCodeRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ResendCashoutVerificationCodeResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var ipAddress = EndpointUtils.GetIpAddress(HttpContext);
        var geoLocation = await geoLocationService.GetLocationAsync(ipAddress);
        var location = geoLocation.DisplayLocation;

        // Verificar se o merchant pertence ao usuário
        var merchant = await dbContext.Merchants
            .Include(m => m.User)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ResendCashoutVerificationCodeResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        // Buscar a conta de saque
        var payoutAccount = await dbContext.MerchantPayoutAccounts
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync(a => a.Id == req.AccountId && a.MerchantId == req.MerchantId, ct);

        if (payoutAccount == null)
        {
            await Send.ResponseAsync(new ResendCashoutVerificationCodeResponse
            {
                Error = new("Conta de saque não encontrada.")
            }, 404, ct);
            return;
        }

        if (payoutAccount.Status != PayoutAccountStatus.Pending)
        {
            await Send.ResponseAsync(new ResendCashoutVerificationCodeResponse
            {
                Error = new("Apenas contas pendentes de verificação podem receber novo código.")
            }, 400, ct);
            return;
        }

        // Invalidar códigos anteriores
        var pendingCodes = await dbContext.PayoutAccountVerificationCodes
            .Where(c => c.MerchantPayoutAccountId == req.AccountId 
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
            Status = PayoutAccountVerificationCodeStatus.Pending,
            ExpiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes)
        };

        dbContext.PayoutAccountVerificationCodes.Add(verificationCode);
        await dbContext.SaveChangesAsync(ct);

        // Enviar e-mail com novo código
        var user = merchant.User;
        var now = DateTime.UtcNow;
        var brazilTimeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
        var brazilTime = TimeZoneInfo.ConvertTimeFromUtc(now, brazilTimeZone);

        _ = emailService.SendAsync(
            user.Email,
            "🔐 Novo Código de Verificação - Safefy",
            EmailTemplate.PayoutAccountActionVerification,
            new Dictionary<string, string>
            {
                { "NAME", user.Name },
                { "MERCHANT_NAME", merchant.Name ?? "Sua organização" },
                { "ACTION_DESCRIPTION", "ativar uma conta de saque" },
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

        await Send.OkAsync(new ResendCashoutVerificationCodeResponse
        {
            Message = "Novo código de verificação enviado para seu e-mail."
        }, ct);
    }

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
