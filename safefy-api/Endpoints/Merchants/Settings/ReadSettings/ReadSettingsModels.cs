using System.Text.Json.Serialization;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Merchants.Settings.ReadSettings;

public sealed class ReadSettingsRequest
{
    public Guid MerchantId { get; set; }
}

public sealed class ReadSettingsResponse : BaseResponse<ReadSettingsData>;

public sealed class ReadSettingsData
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public bool SelfNominalSwitchEnabled { get; set; }
    public bool IsAutomaticCashoutEnabled { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AutomaticCashoutFrequency AutomaticCashoutFrequency { get; set; }
    public long? AutomaticCashoutMinAmount { get; set; }
    public long? AutomaticCashoutMaxAmount { get; set; }
    public Guid? AutomaticCashoutPayoutAccountId { get; set; }
    public DateTime? NextAutomaticCashoutAttemptAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
