using System.Net;
using System.Text;
using System.Text.Json;

namespace Swiftpay.WebApi.Tests;

public class MockMagicPayHandler : DelegatingHandler
{
    private readonly Dictionary<string, JsonElement> _payments = new();

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
    {
        var path = request.RequestUri?.AbsolutePath ?? "";
        var body = request.Content != null ? await request.Content.ReadAsStringAsync(ct) : "";

        if (path == "/v1/payment" && request.Method == HttpMethod.Post)
        {
            var json = JsonDocument.Parse(body);
            var method = json.RootElement.GetProperty("method").GetString();
            var amount = json.RootElement.GetProperty("amount").GetInt64();
            var id = $"pay_mock_{Guid.NewGuid():N}";

            object response = method switch
            {
                "PIX" => new
                {
                    id,
                    amount,
                    currency = "BRL",
                    status = "PENDING",
                    data = new
                    {
                        copypaste = $"000201010212{id}",
                        e2e = $"E{id}"
                    },
                    payer = new
                    {
                        name = "Test",
                        taxId = "123"
                    },
                    createdAt = DateTime.UtcNow
                },
                "BOLETO" => new
                {
                    id,
                    amount,
                    currency = "BRL",
                    status = "PENDING",
                    data = new
                    {
                        barcode = $"{id}34191.79001 01043.510047 91020.150008 4 12340000001000",
                        boletoUrl = $"https://mock/{id}.pdf"
                    },
                    createdAt = DateTime.UtcNow
                },
                "CREDIT_CARD" => new
                {
                    id,
                    amount,
                    currency = "BRL",
                    status = "PAID",
                    data = new
                    {
                        message = "Approved",
                        cardHolder = "JOHN DOE",
                        cardNumber = "411111******1111"
                    },
                    authorizationCode = "123456",
                    paidAt = DateTime.UtcNow,
                    createdAt = DateTime.UtcNow
                },
                _ => new
                {
                    id,
                    amount,
                    status = "PENDING",
                    createdAt = DateTime.UtcNow
                }
            };

            var responseJson = JsonSerializer.Serialize(response);
            var resp = new HttpResponseMessage(HttpStatusCode.Created)
            {
                Content = new StringContent(responseJson, Encoding.UTF8, "application/json")
            };
            _payments[id] = JsonDocument.Parse(responseJson).RootElement;
            return resp;
        }

        if (path.Contains("/refund"))
        {
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(new { status = "REFUNDED" }),
                    Encoding.UTF8, "application/json")
            };
        }

        return new HttpResponseMessage(HttpStatusCode.NotFound);
    }
}
