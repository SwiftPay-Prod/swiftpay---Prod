using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api.Mappers;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Settings.ReadPlatformSettings;

public sealed class ReadPlatformSettingsEndpoint(
    PrimaryDbContext dbContext,
    IEnvironmentProvider environmentProvider
) : EndpointWithoutRequest<ReadPlatformSettingsResponse>
{
    public override void Configure()
    {
        Get("platform-settings");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new ReadPlatformSettingsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var settings = await dbContext.PlatformSettings.OrderBy(p => p.Id).FirstOrDefaultAsync(ct);

        if (settings == null)
        {
            await Send.ResponseAsync(new ReadPlatformSettingsResponse
            {
                Error = new("Configurações da plataforma não encontradas.")
            }, 404, ct);
            return;
        }

        await Send.OkAsync(new ReadPlatformSettingsResponse
        {
            Data = PlatformSettingsMapper.ToData(
                settings,
                await GetNextAutomaticCashoutAttemptAtAsync(
                    dbContext,
                    environmentProvider.CurrentEnvironment,
                    settings.IsAutomaticCashoutEnabled,
                    settings.AutomaticCashoutFrequency,
                    settings.UpdatedAt,
                    ct))
        }, ct);
    }

    private static async Task<DateTime?> GetNextAutomaticCashoutAttemptAtAsync(
        PrimaryDbContext dbContext,
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
            .Where(l => l.MerchantId == null && l.Environment == environment)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => (DateTime?)l.CreatedAt)
            .FirstOrDefaultAsync(ct);

        var anchor = lastAttemptAt ?? settingsUpdatedAt;
        return CalculateNextEligibleAt(frequency, anchor);
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
