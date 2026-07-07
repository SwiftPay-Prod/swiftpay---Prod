using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using swiftpay_api_payment.Tests.Fixtures;
using swiftpay_api_payment.Tests.Models;

namespace swiftpay_api_payment.Tests.Integration;

/// <summary>
/// E2E (End-to-End) do fluxo principal:
/// 1) autentica credencial
/// 2) cria transacao
/// 3) confirma pagamento
/// 4) cria saque
/// 5) confirma saque
/// 6) valida saldo e totais
/// </summary>
public class EndToEndFlowTests : IClassFixture<PaymentApiFactory>
{
    private readonly PaymentApiFactory _factory;
    private readonly JsonSerializerOptions _jsonOptions;
    private readonly JsonSerializerOptions _jsonRequestOptions;

    public EndToEndFlowTests(PaymentApiFactory factory)
    {
        _factory = factory;
        _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        _jsonRequestOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };
    }

    [Fact]
    public async Task EndToEnd_HappyPath_CreatePaymentThenCashout_ShouldKeepLedgerConsistent()
    {
        await _factory.SeedTestDataAsync();
        await _factory.CleanupPaymentsAsync();

        using var client = _factory.CreateClient();
        var token = await _factory.GetOrCacheTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var paymentResponse = await PostJsonAsync(client, "/v1/transactions", new
        {
            Method = "pix",
            Amount = 10000,
            Currency = "BRL",
            Description = "E2E payment",
            ExternalId = $"e2e_{Guid.NewGuid():N}"
        });

        paymentResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var paymentPayload = JsonSerializer.Deserialize<PaymentResponse>(await paymentResponse.Content.ReadAsStringAsync(), _jsonOptions);
        paymentPayload!.Data.Should().NotBeNull();
        var payment = paymentPayload.Data!;

        var completePaymentResponse = await PostJsonAsync(client, $"/v1/transactions/{payment.Id}/simulate", new { Action = "complete" });
        completePaymentResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var balanceAfterPayment = await GetBalanceAsync(client);
        balanceAfterPayment.Balance!.Available.Should().Be(9850);
        balanceAfterPayment.Balance.Reserved.Should().Be(0);

        var cashoutResponse = await PostJsonAsync(client, "/v1/cashouts", new
        {
            Amount = 5000,
            PixKeyType = "Email",
            PixKey = "e2e@swiftpay.com"
        });

        cashoutResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var cashoutPayload = JsonSerializer.Deserialize<CreateCashoutResponse>(await cashoutResponse.Content.ReadAsStringAsync(), _jsonOptions);
        cashoutPayload!.Data.Should().NotBeNull();
        var cashout = cashoutPayload.Data!;

        var completeCashoutResponse = await PostJsonAsync(client, $"/v1/cashouts/{cashout.Id}/simulate", new { Action = "complete" });
        completeCashoutResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var finalBalance = await GetBalanceAsync(client);
        finalBalance.Balance!.Available.Should().Be(4850);
        finalBalance.Balance.Reserved.Should().Be(0);
        finalBalance.Totals!.LifetimeVolume.Should().Be(10000);
        finalBalance.Totals.LifetimePayouts.Should().Be(5000);
        finalBalance.Totals.LifetimeRefunds.Should().Be(0);
    }

    private async Task<BalanceData> GetBalanceAsync(HttpClient client)
    {
        var response = await client.GetAsync("/v1/balance");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);

        var payload = JsonSerializer.Deserialize<GetBalanceResponse>(body, _jsonOptions);
        payload!.Data.Should().NotBeNull();
        return payload.Data!;
    }

    private Task<HttpResponseMessage> PostJsonAsync<T>(HttpClient client, string url, T content)
    {
        var json = JsonContent.Create(content, options: _jsonRequestOptions);
        return client.PostAsync(url, json);
    }
}
