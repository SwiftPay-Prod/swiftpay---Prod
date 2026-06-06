namespace Swiftpay.Api.Core.Providers.Coratri;

public class CoratriPixService : IPaymentProvider
{
    private readonly CoratriClient _client;
    public string ProviderName => "Coratri";

    public CoratriPixService(CoratriClient client) { _client = client; }

    public async Task<PixGenerationResult> GeneratePixAsync(PixGenerationRequest request, CancellationToken ct)
    {
        decimal amountInReais = request.Amount / 100m;
        return await _client.CreatePixAsync(
            amountInReais, request.PayerName, request.PayerEmail,
            request.PayerTaxId, request.PayerPhone, request.NotificationUrl, ct);
    }

    public Task<PixStatusResult> GetPixStatusAsync(string transactionId, CancellationToken ct)
    {
        throw new NotImplementedException("Use CoratriClient directly for status");
    }

    public Task<PixRefundResult> RefundAsync(string transactionId, long amount, CancellationToken ct)
    {
        throw new NotImplementedException("Refund not implemented for Coratri");
    }
}
