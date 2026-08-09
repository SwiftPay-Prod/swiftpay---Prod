using swiftpay_api_core.Models.Email;

namespace swiftpay_api_core.Interfaces;

public interface IEmailOutboxPublisher
{
    Task<EmailOutboxPublishResult> PublishAsync(
        EmailOutboxPublishRequest request,
        CancellationToken cancellationToken = default);
}
