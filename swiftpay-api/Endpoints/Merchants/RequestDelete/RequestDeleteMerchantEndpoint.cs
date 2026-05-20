using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Email;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Interfaces;

namespace safefy_api.Endpoints.Merchants.RequestDelete;

public sealed class RequestDeleteMerchantEndpoint(
    PrimaryDbContext dbContext,
    IEmailService emailService,
    ISecurityLogService securityLog
) : Endpoint<RequestDeleteMerchantRequest, RequestDeleteMerchantResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/request-delete");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(RequestDeleteMerchantRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new RequestDeleteMerchantResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .Include(m => m.User)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new RequestDeleteMerchantResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status == MerchantStatus.Deleted)
        {
            await Send.ResponseAsync(new RequestDeleteMerchantResponse
            {
                Error = new("Esta organização já foi excluída.")
            }, 400, ct);
            return;
        }

        if (merchant.Status == MerchantStatus.Suspended || merchant.Status == MerchantStatus.Inactive)
        {
            await Send.ResponseAsync(new RequestDeleteMerchantResponse
            {
                Error = new("Não é possível excluir uma organização suspensa ou inativa. Entre em contato com o suporte.")
            }, 400, ct);
            return;
        }

        // Expire any existing pending deletion codes for this merchant
        var existingCodes = await dbContext.MerchantDeletionCodes
            .Where(c => c.MerchantId == req.MerchantId && c.Status == MerchantDeletionCodeStatus.Pending)
            .ToListAsync(ct);

        foreach (var existingCode in existingCodes)
        {
            existingCode.Status = MerchantDeletionCodeStatus.ExpiredByNewCode;
        }

        // Generate new code
        var code = CryptoUtils.GenerateCode();
        var codeHash = CryptoUtils.ComputeSha256Hash(code);

        var deletionCode = new MerchantDeletionCode
        {
            MerchantId = merchant.Id,
            UserId = userId.Value,
            CodeHash = codeHash,
            Status = MerchantDeletionCodeStatus.Pending,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10),
            CreatedAt = DateTime.UtcNow
        };

        dbContext.MerchantDeletionCodes.Add(deletionCode);
        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.MerchantDeleted,
            Status = SecurityLogStatus.Warning,
            UserId = userId,
            Details = $"Código de exclusão solicitado para merchant {merchant.Id}"
        });

        // Send email with deletion code
        await SendDeletionCodeEmailAsync(merchant.User, merchant, code);

        await Send.OkAsync(new RequestDeleteMerchantResponse
        {
            Message = "Código de confirmação enviado para seu e-mail. Verifique sua caixa de entrada."
        }, ct);
    }

    private async Task SendDeletionCodeEmailAsync(User user, Merchant merchant, string code)
    {
        try
        {
            await emailService.SendAsync(
                user.Email,
                "⚠️ Código de confirmação para exclusão - Safefy",
                EmailTemplate.MerchantDeletionCode,
                new Dictionary<string, string>
                {
                    { "NAME", user.Name },
                    { "MERCHANT_NAME", merchant.Name ?? "Sua organização" },
                    { "CODE", code },
                    { "EXPIRES_IN", "10" }
                },
                userId: user.Id,
                merchantId: merchant.Id
            );
        }
        catch
        {
            // Don't fail the request if email fails
        }
    }
}
