using Swiftpay.Api.Core.Providers.MagicPay.Models;

namespace Swiftpay.Api.Core.Providers.MagicPay;

public class MagicPayPixService : IPaymentProvider
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
            request.Amount, "BRL", request.Method, request.Description,
            request.ExternalRef, request.NotificationUrl,
            new MagicPayPayer(request.PayerName, request.PayerTaxId, request.PayerEmail, request.PayerPhone));

        return await _client.CreatePaymentAsync(payload, ct);
    }

    public Task<PixStatusResult> GetPixStatusAsync(string transactionId, CancellationToken ct)
        => _client.GetPaymentStatusAsync(transactionId, ct);

    public async Task<PixRefundResult> RefundAsync(string transactionId, long amount, CancellationToken ct)
        => await _client.RefundPaymentAsync(transactionId, amount, ct);
}
