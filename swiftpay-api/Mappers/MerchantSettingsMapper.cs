using safefy_api.Endpoints.Merchants.Settings.ReadSettings;
using safefy_api.Endpoints.Merchants.Settings.UpdateSettings;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Mappers;

public static class MerchantSettingsMapper
{
    public static ReadSettingsData ToData(
        MerchantSettings settings,
        ApiEnvironment environment,
        bool selfNominalSwitchEnabled,
        DateTime? nextAutomaticCashoutAttemptAt = null)
    {
        var automaticCashout = ResolveAutomaticCashout(settings, environment);

        return new()
        {
            Id = settings.Id,
            MerchantId = settings.MerchantId,
            SelfNominalSwitchEnabled = selfNominalSwitchEnabled,
            IsAutomaticCashoutEnabled = automaticCashout.IsEnabled,
            AutomaticCashoutFrequency = automaticCashout.Frequency,
            AutomaticCashoutMinAmount = automaticCashout.MinAmount,
            AutomaticCashoutMaxAmount = automaticCashout.MaxAmount,
            AutomaticCashoutPayoutAccountId = automaticCashout.PayoutAccountId,
            NextAutomaticCashoutAttemptAt = nextAutomaticCashoutAttemptAt,
            UpdatedAt = settings.UpdatedAt
        };
    }

    public static MerchantSettingsData ToUpdateData(
        MerchantSettings settings,
        ApiEnvironment environment,
        bool selfNominalSwitchEnabled)
    {
        var automaticCashout = ResolveAutomaticCashout(settings, environment);

        return new()
        {
            Id = settings.Id,
            MerchantId = settings.MerchantId,
            SelfNominalSwitchEnabled = selfNominalSwitchEnabled,
            IsAutomaticCashoutEnabled = automaticCashout.IsEnabled,
            AutomaticCashoutFrequency = automaticCashout.Frequency,
            AutomaticCashoutMinAmount = automaticCashout.MinAmount,
            AutomaticCashoutMaxAmount = automaticCashout.MaxAmount,
            AutomaticCashoutPayoutAccountId = automaticCashout.PayoutAccountId,
            UpdatedAt = settings.UpdatedAt
        };
    }

    public static ReadSettingsData ToEmptyData(Guid merchantId, bool selfNominalSwitchEnabled) => new()
    {
        Id = Guid.Empty,
        MerchantId = merchantId,
        SelfNominalSwitchEnabled = selfNominalSwitchEnabled,
        IsAutomaticCashoutEnabled = false,
        AutomaticCashoutFrequency = AutomaticCashoutFrequency.Daily,
        AutomaticCashoutMinAmount = null,
        AutomaticCashoutMaxAmount = null,
        AutomaticCashoutPayoutAccountId = null,
        NextAutomaticCashoutAttemptAt = null,
        UpdatedAt = DateTime.UtcNow
    };

    private static MerchantAutomaticCashoutResolved ResolveAutomaticCashout(MerchantSettings settings, ApiEnvironment environment)
    {
        if (environment == ApiEnvironment.Sandbox)
        {
            return new MerchantAutomaticCashoutResolved(
                settings.IsAutomaticCashoutEnabledSandbox,
                settings.AutomaticCashoutFrequencySandbox,
                settings.AutomaticCashoutMinAmountSandbox,
                settings.AutomaticCashoutMaxAmountSandbox,
                settings.AutomaticCashoutPayoutAccountIdSandbox);
        }

        return new MerchantAutomaticCashoutResolved(
            settings.IsAutomaticCashoutEnabled,
            settings.AutomaticCashoutFrequency,
            settings.AutomaticCashoutMinAmount,
            settings.AutomaticCashoutMaxAmount,
            settings.AutomaticCashoutPayoutAccountId);
    }

    private sealed record MerchantAutomaticCashoutResolved(
        bool IsEnabled,
        AutomaticCashoutFrequency Frequency,
        long? MinAmount,
        long? MaxAmount,
        Guid? PayoutAccountId);
}
