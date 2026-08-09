using swiftpay_api_core.Models.Email;

namespace swiftpay_api_core.Interfaces;

public interface IEmailIntentWriter
{
    ValueTask<EmailIntentHandle> Add(
        EmailIntentAddRequest request,
        CancellationToken cancellationToken = default);
}
