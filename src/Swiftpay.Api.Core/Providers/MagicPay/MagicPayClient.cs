using System.Net.Http.Json;
using Swiftpay.Api.Core.Providers.MagicPay.Models;

namespace Swiftpay.Api.Core.Providers.MagicPay;

public class MagicPayClient
{
    private readonly HttpClient _http;
    private readonly MagicPayResponseParser _parser;

    public MagicPayClient(HttpClient http, MagicPayResponseParser parser)
    {
        _http = http;
        _parser = parser;
    }

    public async Task<PixGenerationResult> CreatePaymentAsync(MagicPayPaymentRequest request, CancellationToken ct)
    {
        var response = await _http.PostAsJsonAsync("/v1/payment", request, ct);
        var json = await response.Content.ReadAsStringAsync(ct);
        return _parser.ParseCreatePaymentResponse(json);
    }
}
