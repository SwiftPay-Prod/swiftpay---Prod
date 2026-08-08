using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using swiftpay_api_payment.Clients.AkkadPag;

namespace swiftpay_api_payment.Tests.Unit.Clients;

public sealed class AkkadPagClientTests
{
    [Fact]
    public async Task GetPaymentAsync_ShouldReadPaymentFromDataEnvelope()
    {
        const string responseBody = """
            {
              "statusCode": 200,
              "message": "Transação encontrada",
              "data": {
                "id": "81158e9a-6433-430b-8895-d8bc00c3dfd5",
                "amount": 500,
                "payment_method": "PIX",
                "status": "WAITING_PAYMENT",
                "pix": {
                  "copy_paste": "000201010212...",
                  "end_to_end": null,
                  "expires_at": "2026-08-08T02:55:40.144Z"
                }
              }
            }
            """;
        using var handler = new StubHttpMessageHandler(responseBody);
        using var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://api.akkadpag.com/v1/")
        };
        var client = new AkkadPagClient(httpClient, NullLogger<AkkadPagClient>.Instance);

        var result = await client.GetPaymentAsync("public-key", "secret-key", "transaction-id");

        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.StatusCode.Should().Be(200);
        result.Data.Data.Should().NotBeNull();
        result.Data.Data!.Id.Should().Be("81158e9a-6433-430b-8895-d8bc00c3dfd5");
        result.Data.Data.Status.Should().Be("WAITING_PAYMENT");
        result.Data.Data.Pix!.CopyPaste.Should().Be("000201010212...");
        handler.Authorization.Should().Be(
            $"Basic {Convert.ToBase64String(Encoding.UTF8.GetBytes("public-key:secret-key"))}");
    }

    private sealed class StubHttpMessageHandler(string responseBody) : HttpMessageHandler
    {
        public string? Authorization { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Authorization = request.Headers.Authorization?.ToString();
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(responseBody, Encoding.UTF8, "application/json")
            });
        }
    }
}
