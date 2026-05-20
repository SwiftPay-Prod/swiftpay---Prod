using safefy_api_core.Models.Inputs;

namespace safefy_api_core.Interfaces;

public interface IAcquirerWebhookLogService
{
    Task LogAsync(AcquirerWebhookLogInput input);
}
