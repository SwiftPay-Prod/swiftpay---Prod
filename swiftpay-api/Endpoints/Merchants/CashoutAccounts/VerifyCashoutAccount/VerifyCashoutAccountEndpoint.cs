using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;
using swiftpay_api.Endpoints.Merchants.CashoutAccounts.CreateCashoutAccount;

namespace swiftpay_api.Endpoints.Merchants.CashoutAccounts.VerifyCashoutAccount;

public sealed class VerifyCashoutAccountEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    IGeoLocationService geoLocationService,
    IEmailService emailService,
    INotificationService notificationService
) : Endpoint<VerifyCashoutAccountRequest, VerifyCashoutAccountResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/cashout-accounts/{accountId:guid}/verify");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(VerifyCashoutAccountRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new VerifyCashoutAccountResponse
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
            await Send.ResponseAsync(new VerifyCashoutAccountResponse
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
            await Send.ResponseAsync(new VerifyCashoutAccountResponse
            {
                Error = new("Conta de saque não encontrada.")
            }, 404, ct);
            return;
        }

        if (payoutAccount.Status == PayoutAccountStatus.Active)
        {
            await Send.ResponseAsync(new VerifyCashoutAccountResponse
            {
                Error = new("Esta conta de saque já está ativa.")
            }, 400, ct);
            return;
        }

        if (payoutAccount.Status != PayoutAccountStatus.Pending)
        {
            await Send.ResponseAsync(new VerifyCashoutAccountResponse
            {
                Error = new("Esta conta de saque não pode ser verificada.")
            }, 400, ct);
            return;
        }

        // Buscar código de verificação
        var codeHash = CryptoUtils.ComputeSha256Hash(req.Code);

        var verificationCode = await dbContext.PayoutAccountVerificationCodes
            .Where(c => c.MerchantPayoutAccountId == req.AccountId && c.CodeHash == codeHash)
            .OrderByDescending(c => c.CreatedAt)
            .OrderBy(x => x.Id)
            .FirstOrDefaultAsync(ct);

        if (verificationCode == null)
        {
            await securityLog.LogAsync(new SecurityLogInput
            {
                Action = SecurityLogAction.PayoutAccountVerified,
                Status = SecurityLogStatus.Failed,
                UserId = userId,
                Details = $"Código de verificação inválido para conta de saque {payoutAccount.Id}"
            });

            await Send.ResponseAsync(new VerifyCashoutAccountResponse
            {
                Error = new("Código de verificação inválido.")
            }, 400, ct);
            return;
        }

        // Verificar expiração
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
                Action = SecurityLogAction.PayoutAccountVerified,
                Status = SecurityLogStatus.Failed,
                UserId = userId,
                Details = $"Código inválido para conta de saque {payoutAccount.Id}: {message}"
            });

            await Send.ResponseAsync(new VerifyCashoutAccountResponse
            {
                Error = new(message)
            }, 400, ct);
            return;
        }

        // Marcar código como usado
        verificationCode.Status = PayoutAccountVerificationCodeStatus.Used;

        // Ativar conta de saque
        payoutAccount.Status = PayoutAccountStatus.Active;
        payoutAccount.UpdatedAt = DateTime.UtcNow;

        // Verificar se precisa definir como padrão (primeira conta ativa)
        var hasDefaultAccount = await dbContext.MerchantPayoutAccounts
            .AnyAsync(a => a.MerchantId == req.MerchantId 
                && a.Id != payoutAccount.Id 
                && a.Status == PayoutAccountStatus.Active 
                && a.IsDefault, ct);

        if (!hasDefaultAccount)
        {
            payoutAccount.IsDefault = true;
        }

        await dbContext.SaveChangesAsync(ct);

        // Registrar log de segurança
        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.PayoutAccountVerified,
            Status = SecurityLogStatus.Success,
            UserId = userId,
            Details = $"Conta de saque verificada e ativada: {payoutAccount.Id} para merchant {merchant.Id}"
        });

        // Criar notificação
        _ = notificationService.CreateSuccessNotificationAsync(
            req.MerchantId,
            "Conta de saque ativada!",
            $"Sua conta de saque foi verificada e está pronta para uso. Agora você pode realizar saques.",
            actionUrl: "/settings/payout-accounts",
            actionLabel: "Ver contas de saque"
        );

        // Enviar e-mail de confirmação
        var user = merchant.User;
        var now = DateTime.UtcNow;
        var brazilTimeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
        var brazilTime = TimeZoneInfo.ConvertTimeFromUtc(now, brazilTimeZone);

        _ = emailService.SendAsync(
            user.Email,
            "✅ Conta de Saque Ativada - SwiftPay",
            EmailTemplate.PayoutAccountCreated,
            new Dictionary<string, string>
            {
                { "NAME", user.Name },
                { "MERCHANT_NAME", merchant.Name ?? "Sua organização" },
                { "PIX_KEY_TYPE", GetPixKeyTypeDisplayName(payoutAccount.PixKeyType) },
                { "PIX_KEY", MaskPixKey(payoutAccount.PixKey, payoutAccount.PixKeyType) },
                { "HOLDER_NAME", payoutAccount.HolderName ?? "-" },
                { "IS_DEFAULT", payoutAccount.IsDefault ? "Sim" : "Não" },
                { "DATE", brazilTime.ToString("dd/MM/yyyy") },
                { "TIME", brazilTime.ToString("HH:mm:ss") },
                { "IP_ADDRESS", ipAddress },
                { "LOCATION", location }
            },
            userId: user.Id,
            merchantId: merchant.Id
        );

        await Send.OkAsync(new VerifyCashoutAccountResponse
        {
            Data = new VerifyCashoutAccountData
            {
                Id = payoutAccount.Id,
                PixKeyType = payoutAccount.PixKeyType,
                PixKey = MaskPixKey(payoutAccount.PixKey, payoutAccount.PixKeyType),
                HolderName = payoutAccount.HolderName,
                Status = payoutAccount.Status,
                IsDefault = payoutAccount.IsDefault,
                CreatedAt = payoutAccount.CreatedAt
            },
            Message = "Conta de saque verificada e ativada com sucesso!"
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

    private static string MaskPixKey(string pixKey, PixKeyType keyType)
    {
        if (string.IsNullOrEmpty(pixKey) || pixKey.Length < 6)
            return pixKey;

        return keyType switch
        {
            PixKeyType.Cpf => $"***{pixKey.Substring(3, 6)}**",
            PixKeyType.Cnpj => $"**{pixKey.Substring(2, 8)}****",
            PixKeyType.Email => MaskEmail(pixKey),
            PixKeyType.Phone => $"{pixKey[..4]}****{pixKey[^4..]}",
            PixKeyType.Random => $"{pixKey[..8]}...{pixKey[^4..]}",
            _ => pixKey
        };
    }

    private static string MaskEmail(string email)
    {
        var atIndex = email.IndexOf('@');
        if (atIndex <= 2)
            return email;

        var localPart = email[..atIndex];
        var domain = email[atIndex..];
        var maskedLocal = $"{localPart[0]}***{localPart[^1]}";
        return $"{maskedLocal}{domain}";
    }
}
