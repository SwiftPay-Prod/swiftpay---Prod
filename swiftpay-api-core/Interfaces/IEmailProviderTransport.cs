using swiftpay_api_core.Models.Email;

namespace swiftpay_api_core.Interfaces;

public interface IEmailProviderTransport
{
    Task<EmailProviderResult> SendAsync(
        EmailOutboxEnvelope envelope,
        CancellationToken cancellationToken = default);
}
