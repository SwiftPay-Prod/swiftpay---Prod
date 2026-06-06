using System.Net.Http.Json;
using System.Text.Json;
using Swiftpay.Api.Core.Providers.Coratri.Models;

namespace Swiftpay.Api.Core.Providers.Coratri;

public class CoratriClient
{
    private readonly HttpClient _http;
    private readonly CoratriResponseParser _parser;
    private readonly string _clientKey;
    private readonly string _clientSecret;

    public CoratriClient(HttpClient http, CoratriResponseParser parser, string clientKey, string clientSecret)
    {
        _http = http;
        _parser = parser;
        _clientKey = clientKey;
        _clientSecret = clientSecret;
    }

    public async Task<PixGenerationResult> CreatePixAsync(
        decimal amount, string debtorName, string email,
        string? document, string? phone, string? postbackUrl, CancellationToken ct)
    {
        var request = new CoratriPixRequest(
            _clientKey, _clientSecret, amount, debtorName, email,
            document, phone, postbackUrl);

        var response = await _http.PostAsJsonAsync("/api/wallet/deposit/payment", request, ct);
        var json = await response.Content.ReadAsStringAsync(ct);
        return _parser.ParseCreatePixResponse(json);
    }

    public async Task<string?> GetTransactionStatusAsync(string transactionId, CancellationToken ct)
    {
        var response = await _http.PostAsJsonAsync("/api/status",
            new { idTransaction = transactionId }, ct);
        var json = await response.Content.ReadAsStringAsync(ct);
        var resp = JsonSerializer.Deserialize<CoratriStatusResponse>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        return resp?.Status;
    }
}
