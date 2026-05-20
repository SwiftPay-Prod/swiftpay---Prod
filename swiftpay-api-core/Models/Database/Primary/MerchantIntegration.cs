using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.Integrations;

namespace safefy_api_core.Models.Database;

public class MerchantIntegration : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid MerchantId { get; set; }

    public MerchantIntegrationProvider Provider { get; set; } = MerchantIntegrationProvider.Utmify;

    public MerchantIntegrationType Type { get; set; } = MerchantIntegrationType.Tracking;

    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;

    public Dictionary<string, string> ConfigValues { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public bool IsEnabled { get; set; }

    public bool WaitingPaymentEnabled { get; set; } = true;

    public bool PaidEnabled { get; set; } = true;

    public bool RefusedEnabled { get; set; } = true;

    public bool RefundedEnabled { get; set; } = true;

    public bool ChargedbackEnabled { get; set; } = true;

    // Relationships
    public Merchant Merchant { get; set; } = null!;
}
