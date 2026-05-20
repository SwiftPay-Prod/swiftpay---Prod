using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Users.Referrals.UpdateReferralPayoutPixKey;

public sealed class UpdateReferralPayoutPixKeyEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<UpdateReferralPayoutPixKeyRequest, UpdateReferralPayoutPixKeyResponse>
{
    public override void Configure()
    {
        Patch("referrals/payout-pix-key");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(UpdateReferralPayoutPixKeyRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpdateReferralPayoutPixKeyResponse
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
            await Send.ResponseAsync(new UpdateReferralPayoutPixKeyResponse
            {
                Error = new("Usuário não encontrado.")
            }, 404, ct);
            return;
        }

        if (!user.ReferralPayoutPixKeyVerificationId.HasValue
            || user.ReferralPayoutPixKeyVerificationId.Value != req.VerificationId)
        {
            await Send.ResponseAsync(new UpdateReferralPayoutPixKeyResponse
            {
                Error = new("Solicitação de verificação inválida. Solicite um novo código.")
            }, 400, ct);
            return;
        }

        if (!user.ReferralPayoutPixKeyVerificationCodeExpiresAt.HasValue
            || user.ReferralPayoutPixKeyVerificationCodeExpiresAt.Value <= DateTime.UtcNow)
        {
            await Send.ResponseAsync(new UpdateReferralPayoutPixKeyResponse
            {
                Error = new("O código de verificação expirou. Solicite um novo código.")
            }, 400, ct);
            return;
        }

        if (user.ReferralPayoutPixKeyVerificationCodeFailedAttempts >= 5)
        {
            await Send.ResponseAsync(new UpdateReferralPayoutPixKeyResponse
            {
                Error = new("Número máximo de tentativas excedido. Solicite um novo código.")
            }, 400, ct);
            return;
        }

        var codeHash = CryptoUtils.ComputeSha256Hash(req.Code);
        if (!string.Equals(user.ReferralPayoutPixKeyVerificationCodeHash, codeHash, StringComparison.Ordinal))
        {
            user.ReferralPayoutPixKeyVerificationCodeFailedAttempts++;
            user.UpdatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(ct);

            await Send.ResponseAsync(new UpdateReferralPayoutPixKeyResponse
            {
                Error = new("Código de verificação inválido.")
            }, 400, ct);
            return;
        }

        user.ReferralPayoutPixKeyType = req.PixKeyType;
        user.ReferralPayoutPixKey = req.PixKey.Trim();
        user.ReferralPayoutPixKeyVerificationId = null;
        user.ReferralPayoutPixKeyVerificationCodeHash = null;
        user.ReferralPayoutPixKeyVerificationCodeExpiresAt = null;
        user.ReferralPayoutPixKeyVerificationCodeRequestedAt = null;
        user.ReferralPayoutPixKeyVerificationCodeFailedAttempts = 0;
        user.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new UpdateReferralPayoutPixKeyResponse
        {
            Data = new UpdateReferralPayoutPixKeyData
            {
                PixKeyType = user.ReferralPayoutPixKeyType!.Value,
                PixKey = MaskPixKey(user.ReferralPayoutPixKey),
                UpdatedAt = user.UpdatedAt
            },
            Message = "Chave PIX de recebimento atualizada com sucesso."
        }, ct);
    }

    private static string MaskPixKey(string? pixKey)
    {
        if (string.IsNullOrWhiteSpace(pixKey))
        {
            return string.Empty;
        }

        var trimmed = pixKey.Trim();
        if (trimmed.Length <= 6)
        {
            return new string('*', trimmed.Length);
        }

        return $"{trimmed[..3]}{new string('*', trimmed.Length - 6)}{trimmed[^3..]}";
    }
}
