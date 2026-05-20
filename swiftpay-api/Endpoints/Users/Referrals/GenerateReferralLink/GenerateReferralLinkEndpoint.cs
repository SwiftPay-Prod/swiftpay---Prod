using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Models.Settings;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Users.Referrals.GenerateReferralLink;

public sealed class GenerateReferralLinkEndpoint(
    PrimaryDbContext dbContext,
    IOptions<PlatformSettingsOptions> platformSettings
) : EndpointWithoutRequest<GenerateReferralLinkResponse>
{
    public override void Configure()
    {
        Post("referrals/generate");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new GenerateReferralLinkResponse
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
            await Send.ResponseAsync(new GenerateReferralLinkResponse
            {
                Error = new("Usuário não encontrado.")
            }, 404, ct);
            return;
        }

        if (string.IsNullOrWhiteSpace(user.ReferralCode))
        {
            user.ReferralCode = await GenerateUniqueReferralCodeAsync(ct);
            user.ReferralCodeCreatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(ct);
        }

        var referralCode = user.ReferralCode.Trim();
        var baseUrl = platformSettings.Value.BaseUrl.TrimEnd('/');
            var referralLink = $"{baseUrl}/?refCode={Uri.EscapeDataString(referralCode)}";

        await Send.OkAsync(new GenerateReferralLinkResponse
        {
            Data = new GenerateReferralLinkData
            {
                ReferralCode = referralCode,
                ReferralLink = referralLink
            },
            Message = "Link de indicação gerado com sucesso."
        }, ct);
    }

    private async Task<string> GenerateUniqueReferralCodeAsync(CancellationToken ct)
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var code = $"SFY{Guid.NewGuid():N}"[..12].ToUpperInvariant();

            var exists = await dbContext.Users
                .AsNoTracking()
                .AnyAsync(u => u.ReferralCode == code, ct);

            if (!exists)
            {
                return code;
            }
        }

        return $"SFY{Guid.NewGuid():N}".ToUpperInvariant();
    }
}
