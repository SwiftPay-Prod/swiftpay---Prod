using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Messages;

public class ProcessMerchantDashboardMessage
{
    public Guid MerchantId { get; set; }
    public ApiEnvironment Environment { get; set; }
}

public class ProcessAdminDashboardMessage
{
    public ApiEnvironment Environment { get; set; }
}

public class ProcessAcquirerDashboardMessage
{
    public Guid AcquirerId { get; set; }
    public string? Period { get; set; }
}
