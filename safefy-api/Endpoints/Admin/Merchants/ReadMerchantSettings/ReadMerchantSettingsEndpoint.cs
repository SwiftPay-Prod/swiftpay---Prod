using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Models.Database;
using safefy_api.Mappers;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Admin.Merchants.ReadMerchantSettings;

public sealed class ReadMerchantSettingsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadMerchantSettingsRequest, ReadMerchantSettingsResponse>
{
    public override void Configure()
    {
        Get("merchant/{merchantId:guid}/settings");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadMerchantSettingsRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new ReadMerchantSettingsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .Include(m => m.MerchantSettings)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ReadMerchantSettingsResponse
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
            await Send.ResponseAsync(new ReadMerchantSettingsResponse
            {
                Error = new("Configurações da plataforma não encontradas.")
            }, 500, ct);
            return;
        }

        if (settings == null)
        {
            settings = new MerchantSettings
            {
                MerchantId = merchant.Id
            };

            dbContext.MerchantSettings.Add(settings);

            try
            {
                await dbContext.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                settings = await dbContext.MerchantSettings
                    .AsNoTracking()
                    .OrderBy(s => s.Id)
                    .FirstOrDefaultAsync(s => s.MerchantId == merchant.Id, ct);

                if (settings == null)
                {
                    throw;
                }
            }
        }

        await Send.OkAsync(new ReadMerchantSettingsResponse
        {
            Data = AdminMerchantSettingsMapper.ToData(
                settings,
                platformSettings,
                platformSettings.SelfNominalSwitchEnabled,
                await GetNextAutomaticCashoutAttemptAtAsync(
                    dbContext,
                    merchant.Id,
                    ApiEnvironment.Production,
                    settings.IsAutomaticCashoutEnabled,
                    settings.AutomaticCashoutFrequency,
                    settings.UpdatedAt,
                    ct),
                await GetNextAutomaticCashoutAttemptAtAsync(
                    dbContext,
                    merchant.Id,
                    ApiEnvironment.Sandbox,
                    settings.IsAutomaticCashoutEnabledSandbox,
                    settings.AutomaticCashoutFrequencySandbox,
                    settings.UpdatedAt,
                    ct))
        }, ct);
    }

    private static async Task<DateTime?> GetNextAutomaticCashoutAttemptAtAsync(
        PrimaryDbContext dbContext,
        Guid merchantId,
        ApiEnvironment environment,
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
