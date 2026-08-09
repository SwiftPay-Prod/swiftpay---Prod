using swiftpay_api_core.Models.Email;

namespace swiftpay_api_core.Interfaces;

public interface IEmailOutboxStatusReader
{
    Task<EmailOutboxSnapshot?> GetAsync(
        Guid intentId,
        CancellationToken cancellationToken = default);
}
