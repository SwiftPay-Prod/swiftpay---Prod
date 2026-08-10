namespace swiftpay_api_core.Interfaces;

public interface IPlatformAuthActionLinkGenerator
{
    Task<string> GenerateAsync(
        EmailAuthActionLinkRequest request,
        CancellationToken cancellationToken = default);
}
