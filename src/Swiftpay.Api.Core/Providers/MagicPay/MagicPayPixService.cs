using Swiftpay.Api.Core.Providers.MagicPay.Models;

namespace Swiftpay.Api.Core.Providers.MagicPay;

public class MagicPayPixService : IPixProvider
{
    private readonly MagicPayClient _client;

    public string ProviderName => "MagicPay";

    public MagicPayPixService(MagicPayClient client)
    {
        _client = client;
    }

    public async Task<PixGenerationResult> GeneratePixAsync(PixGenerationRequest request, CancellationToken ct)
    {
        var payload = new MagicPayPaymentRequest(
            request.Amount, "BRL", "PIX", request.Description,
            request.ExternalRef, request.NotificationUrl,
            new MagicPayPayer(request.PayerName, request.PayerTaxId, request.PayerEmail, request.PayerPhone));

        return await _client.CreatePaymentAsync(payload, ct);
    }

    public Task<PixStatusResult> GetPixStatusAsync(string transactionId, CancellationToken ct)
        => throw new NotImplementedException();

    public Task<PixRefundResult> RefundAsync(string transactionId, long amount, CancellationToken ct)
        => throw new NotImplementedException();
}
