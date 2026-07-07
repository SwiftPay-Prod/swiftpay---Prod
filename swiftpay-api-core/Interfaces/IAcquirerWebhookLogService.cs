using swiftpay_api_core.Models.Inputs;

namespace swiftpay_api_core.Interfaces;

public interface IAcquirerWebhookLogService
{
    Task LogAsync(AcquirerWebhookLogInput input);
}
