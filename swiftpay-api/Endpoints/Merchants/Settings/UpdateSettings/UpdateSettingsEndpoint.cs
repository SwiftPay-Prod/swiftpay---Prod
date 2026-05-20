using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Interfaces;
using safefy_api.Mappers;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.Settings.UpdateSettings;

public sealed class UpdateSettingsEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    IEnvironmentProvider environmentProvider
) : Endpoint<UpdateSettingsRequest, UpdateSettingsResponse>
{
    public override void Configure()
    {
        Patch("{merchantId:guid}/settings");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(UpdateSettingsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        var userRole = EndpointUtils.GetUserRole(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpdateSettingsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        if (req.AutomaticCashoutFrequency == AutomaticCashoutFrequency.Minutely && userRole != nameof(UserRole.God))
        {
            await Send.ResponseAsync(new UpdateSettingsResponse
            {
                Error = new("A frequência por minuto é permitida apenas para usuários God.")
            }, 403, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .Include(m => m.MerchantSettings)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new UpdateSettingsResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new UpdateSettingsResponse
            {
                Error = new("A organização precisa estar ativa para atualizar as configurações.")
            }, 400, ct);
            return;
        }

        var settings = merchant.MerchantSettings;
        var createdNewSettings = false;
        if (settings == null)
        {
            settings = new MerchantSettings
            {
                MerchantId = merchant.Id
            };
            dbContext.MerchantSettings.Add(settings);
            createdNewSettings = true;
        }

        if (req.IsAutomaticCashoutEnabled.HasValue)
        {
            if (environmentProvider.CurrentEnvironment == ApiEnvironment.Sandbox)
                settings.IsAutomaticCashoutEnabledSandbox = req.IsAutomaticCashoutEnabled.Value;
            else
                settings.IsAutomaticCashoutEnabled = req.IsAutomaticCashoutEnabled.Value;
        }

        if (req.AutomaticCashoutFrequency.HasValue)
        {
            if (environmentProvider.CurrentEnvironment == ApiEnvironment.Sandbox)
                settings.AutomaticCashoutFrequencySandbox = req.AutomaticCashoutFrequency.Value;
            else
                settings.AutomaticCashoutFrequency = req.AutomaticCashoutFrequency.Value;
        }

        if (req.AutomaticCashoutMinAmount.HasValue)
        {
            if (environmentProvider.CurrentEnvironment == ApiEnvironment.Sandbox)
                settings.AutomaticCashoutMinAmountSandbox = req.AutomaticCashoutMinAmount.Value;
            else
                settings.AutomaticCashoutMinAmount = req.AutomaticCashoutMinAmount.Value;
        }

        if (req.AutomaticCashoutMaxAmount.HasValue)
        {
            if (environmentProvider.CurrentEnvironment == ApiEnvironment.Sandbox)
                settings.AutomaticCashoutMaxAmountSandbox = req.AutomaticCashoutMaxAmount.Value;
            else
                settings.AutomaticCashoutMaxAmount = req.AutomaticCashoutMaxAmount.Value;
        }

        if (req.AutomaticCashoutPayoutAccountId.HasValue)
        {
            var payoutAccountExists = await dbContext.MerchantPayoutAccounts
                .AsNoTracking()
                .AnyAsync(a => a.Id == req.AutomaticCashoutPayoutAccountId.Value
                            && a.MerchantId == merchant.Id
                            && a.Status == PayoutAccountStatus.Active, ct);

            if (!payoutAccountExists)
            {
                await Send.ResponseAsync(new UpdateSettingsResponse
                {
                    Error = new("A conta de saque automatizado selecionada não foi encontrada ou não está ativa.")
                }, 400, ct);
                return;
            }

            if (environmentProvider.CurrentEnvironment == ApiEnvironment.Sandbox)
                settings.AutomaticCashoutPayoutAccountIdSandbox = req.AutomaticCashoutPayoutAccountId.Value;
            else
                settings.AutomaticCashoutPayoutAccountId = req.AutomaticCashoutPayoutAccountId.Value;
        }

        settings.UpdatedAt = DateTime.UtcNow;

        try
        {
            await dbContext.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (createdNewSettings && IsMerchantSettingsUniqueViolation(ex))
        {
            if (dbContext.Entry(settings).State == EntityState.Added)
            {
                dbContext.Entry(settings).State = EntityState.Detached;
            }

            settings = await dbContext.MerchantSettings
                .OrderBy(s => s.Id)
                .FirstOrDefaultAsync(s => s.MerchantId == merchant.Id, ct);

            if (settings == null)
            {
                throw;
            }

            if (req.IsAutomaticCashoutEnabled.HasValue)
            {
                if (environmentProvider.CurrentEnvironment == ApiEnvironment.Sandbox)
                    settings.IsAutomaticCashoutEnabledSandbox = req.IsAutomaticCashoutEnabled.Value;
                else
                    settings.IsAutomaticCashoutEnabled = req.IsAutomaticCashoutEnabled.Value;
            }

            if (req.AutomaticCashoutFrequency.HasValue)
            {
                if (environmentProvider.CurrentEnvironment == ApiEnvironment.Sandbox)
                    settings.AutomaticCashoutFrequencySandbox = req.AutomaticCashoutFrequency.Value;
                else
                    settings.AutomaticCashoutFrequency = req.AutomaticCashoutFrequency.Value;
            }

            if (req.AutomaticCashoutMinAmount.HasValue)
            {
                if (environmentProvider.CurrentEnvironment == ApiEnvironment.Sandbox)
                    settings.AutomaticCashoutMinAmountSandbox = req.AutomaticCashoutMinAmount.Value;
                else
                    settings.AutomaticCashoutMinAmount = req.AutomaticCashoutMinAmount.Value;
            }

            if (req.AutomaticCashoutMaxAmount.HasValue)
            {
                if (environmentProvider.CurrentEnvironment == ApiEnvironment.Sandbox)
                    settings.AutomaticCashoutMaxAmountSandbox = req.AutomaticCashoutMaxAmount.Value;
                else
                    settings.AutomaticCashoutMaxAmount = req.AutomaticCashoutMaxAmount.Value;
            }

            if (req.AutomaticCashoutPayoutAccountId.HasValue)
            {
                if (environmentProvider.CurrentEnvironment == ApiEnvironment.Sandbox)
                    settings.AutomaticCashoutPayoutAccountIdSandbox = req.AutomaticCashoutPayoutAccountId.Value;
                else
                    settings.AutomaticCashoutPayoutAccountId = req.AutomaticCashoutPayoutAccountId.Value;
            }

            settings.UpdatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(ct);
        }

        var platformSelfNominalSwitchEnabled = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .Select(p => p.SelfNominalSwitchEnabled)
            .FirstOrDefaultAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.MerchantUpdated, Status = SecurityLogStatus.Success, UserId = userId, Details = $"Configurações do merchant {merchant.Id} atualizadas" });

        await Send.OkAsync(new UpdateSettingsResponse
        {
            Data = MerchantSettingsMapper.ToUpdateData(
                settings,
                environmentProvider.CurrentEnvironment,
                platformSelfNominalSwitchEnabled)
        }, ct);
    }

    private static bool IsMerchantSettingsUniqueViolation(DbUpdateException ex)
        => ex.InnerException is PostgresException pgEx
           && pgEx.SqlState == PostgresErrorCodes.UniqueViolation
           && pgEx.ConstraintName == "IX_MerchantSettings_MerchantId";
}
