using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Models.Settings;
using swiftpay_api_core.Interfaces;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Merchants.CashoutAccounts.CreateCashoutAccount;

public sealed class CreateCashoutAccountEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    IGeoLocationService geoLocationService,
    IEmailService emailService,
    INotificationService notificationService,
    IOptions<PlatformSettingsOptions> platformSettings
) : Endpoint<CreateCashoutAccountRequest, CreateCashoutAccountResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/cashout-accounts");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(CreateCashoutAccountRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreateCashoutAccountResponse
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
            await Send.ResponseAsync(new CreateCashoutAccountResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new CreateCashoutAccountResponse
            {
                Error = new("A organização precisa estar ativa para cadastrar contas de saque.")
            }, 400, ct);
            return;
        }

        var existingAccount = await dbContext.MerchantPayoutAccounts
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync(a => a.MerchantId == req.MerchantId 
                && a.PixKey == req.PixKey 
                && a.Status != PayoutAccountStatus.Inactive, ct);

        if (existingAccount != null)
        {
            await Send.ResponseAsync(new CreateCashoutAccountResponse
            {
                Error = new("Já existe uma conta de saque cadastrada com esta chave PIX.")
            }, 400, ct);
            return;
        }

        if (req.IsDefault)
        {
            var currentDefaultAccounts = await dbContext.MerchantPayoutAccounts
                .Where(a => a.MerchantId == req.MerchantId && a.IsDefault)
                .ToListAsync(ct);

            foreach (var account in currentDefaultAccounts)
            {
                account.IsDefault = false;
                account.UpdatedAt = DateTime.UtcNow;
            }
        }

        var payoutAccount = new MerchantPayoutAccount
        {
            Id = Guid.CreateVersion7(),
            MerchantId = req.MerchantId,
            PixKeyType = req.PixKeyType,
            PixKey = req.PixKey,
            HolderName = req.HolderName,
            BankName = req.BankName,
            Status = PayoutAccountStatus.Pending,
            IsDefault = req.IsDefault
        };

        dbContext.MerchantPayoutAccounts.Add(payoutAccount);

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

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.PayoutAccountCreated,
            Status = SecurityLogStatus.Success,
            UserId = userId,
            Details = $"Conta de saque criada (pendente verificação): {payoutAccount.Id} para merchant {merchant.Id}"
        });

        _ = notificationService.CreateAsync(
            req.MerchantId,
            NotificationType.Payout,
            "Nova conta de saque cadastrada",
            $"Uma nova conta de saque foi cadastrada e aguarda verificação por e-mail. Verifique sua caixa de entrada.",
            NotificationPriority.Normal
        );

        var user = merchant.User;
        var now = DateTime.UtcNow;
        var brazilTimeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
        var brazilTime = TimeZoneInfo.ConvertTimeFromUtc(now, brazilTimeZone);

        _ = emailService.SendAsync(
            user.Email,
            "🔐 Verificação de Conta de Saque - Safefy",
            EmailTemplate.PayoutAccountActionVerification,
            new Dictionary<string, string>
            {
                { "NAME", user.Name },
                { "MERCHANT_NAME", merchant.Name ?? "Sua organização" },
                { "ACTION_DESCRIPTION", "ativar uma nova conta de saque" },
                { "PIX_KEY_TYPE", GetPixKeyTypeDisplayName(req.PixKeyType) },
                { "PIX_KEY", MaskUtils.MaskPixKey(req.PixKey, req.PixKeyType.ToString()) },
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

        await Send.ResponseAsync(new CreateCashoutAccountResponse
        {
            Data = CashoutAccountMapper.ToData(payoutAccount),
            Message = "Conta de saque cadastrada. Verifique seu e-mail para ativar a conta."
        }, 201, ct);
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
