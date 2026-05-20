using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api.Mappers;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Merchants.Settings.ReadSettings;

public sealed class ReadSettingsEndpoint(
    PrimaryDbContext dbContext,
    IEnvironmentProvider environmentProvider
) : Endpoint<ReadSettingsRequest, ReadSettingsResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/settings");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadSettingsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadSettingsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .Include(m => m.MerchantSettings)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ReadSettingsResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var settings = merchant.MerchantSettings;
        var platformSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(ct);

        if (platformSettings == null)
        {
            await Send.ResponseAsync(new ReadSettingsResponse
            {
                Error = new("Configurações da plataforma não encontradas.")
            }, 500, ct);
            return;
        }

        if (settings == null)
        {
            await Send.OkAsync(new ReadSettingsResponse
            {
                Data = MerchantSettingsMapper.ToEmptyData(merchant.Id, platformSettings.SelfNominalSwitchEnabled)
            }, ct);
            return;
        }

        await Send.OkAsync(new ReadSettingsResponse
        {
            Data = MerchantSettingsMapper.ToData(
                settings,
                environmentProvider.CurrentEnvironment,
                platformSettings.SelfNominalSwitchEnabled,
                await GetNextAutomaticCashoutAttemptAtAsync(
                    dbContext,
                    merchant.Id,
                    environmentProvider.CurrentEnvironment,
                    ResolveIsAutomaticCashoutEnabled(settings, environmentProvider.CurrentEnvironment),
                    ResolveAutomaticCashoutFrequency(settings, environmentProvider.CurrentEnvironment),
                    settings.UpdatedAt,
                    ct))
        }, ct);
    }

    private static async Task<DateTime?> GetNextAutomaticCashoutAttemptAtAsync(
        PrimaryDbContext dbContext,
        Guid merchantId,
        safefy_api_core.Models.Enum.ApiEnvironment environment,
        bool isEnabled,
        AutomaticCashoutFrequency frequency,
        DateTime settingsUpdatedAt,
        CancellationToken ct)
    {
        if (!isEnabled)
        {
            return null;
        }

        var lastAttemptAt = await dbContext.AutomaticCashoutLogs
            .AsNoTracking()
            .Where(l => l.MerchantId == merchantId && l.Environment == environment)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => (DateTime?)l.CreatedAt)
            .FirstOrDefaultAsync(ct);

        var anchor = lastAttemptAt ?? settingsUpdatedAt;
        return CalculateNextEligibleAt(frequency, anchor);
    }

    private static bool ResolveIsAutomaticCashoutEnabled(
        MerchantSettings settings,
        safefy_api_core.Models.Enum.ApiEnvironment environment)
    {
        return environment == safefy_api_core.Models.Enum.ApiEnvironment.Sandbox
            ? settings.IsAutomaticCashoutEnabledSandbox
            : settings.IsAutomaticCashoutEnabled;
    }

    private static AutomaticCashoutFrequency ResolveAutomaticCashoutFrequency(
        MerchantSettings settings,
        safefy_api_core.Models.Enum.ApiEnvironment environment)
    {
        return environment == safefy_api_core.Models.Enum.ApiEnvironment.Sandbox
            ? settings.AutomaticCashoutFrequencySandbox
            : settings.AutomaticCashoutFrequency;
    }

    private static DateTime CalculateNextEligibleAt(AutomaticCashoutFrequency frequency, DateTime anchor)
    {
        var anchorUtc = anchor.ToUniversalTime();

        return frequency switch
        {
            AutomaticCashoutFrequency.Minutely => anchorUtc.AddMinutes(1),
            AutomaticCashoutFrequency.Hourly => anchorUtc.AddHours(1),
            AutomaticCashoutFrequency.Daily => anchorUtc.Date.AddDays(1),
            AutomaticCashoutFrequency.Weekly => StartOfWeekUtc(anchorUtc).AddDays(7),
            _ => anchorUtc
        };
    }

    private static DateTime StartOfWeekUtc(DateTime value)
    {
        var utcDate = value.ToUniversalTime().Date;
        var diff = (7 + (utcDate.DayOfWeek - DayOfWeek.Monday)) % 7;
        return utcDate.AddDays(-diff);
    }
}
