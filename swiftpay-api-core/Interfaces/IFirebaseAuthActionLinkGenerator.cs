using swiftpay_api_core.Models.Email;

namespace swiftpay_api_core.Interfaces;

public interface IFirebaseAuthActionLinkGenerator
{
    Task<string> GenerateAsync(
        EmailAuthActionLinkRequest request,
        CancellationToken cancellationToken = default);
}
