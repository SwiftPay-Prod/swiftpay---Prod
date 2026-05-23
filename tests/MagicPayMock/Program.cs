using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var payments = new Dictionary<string, JsonElement>();

app.MapPost("/v1/payment", async (HttpRequest request) =>
{
    using var reader = new StreamReader(request.Body);
    var body = await reader.ReadToEndAsync();
    var json = JsonDocument.Parse(body);
    var method = json.RootElement.GetProperty("method").GetString();
    var amount = json.RootElement.GetProperty("amount").GetInt64();
    var externalRef = json.RootElement.GetProperty("externalRef").GetString() ?? Guid.NewGuid().ToString();
    var id = $"pay_mock_{Guid.NewGuid():N}";

    object response = method switch
    {
        "PIX" => new
        {
            id, amount, currency = "BRL", status = "PENDING", method = "PIX",
            externalRef, data = new
            {
                method = "PIX",
                copypaste = $"000201010212{id}000201010212{id}000201010212{id}",
                e2e = $"E{id}{DateTime.UtcNow:yyyyMMdd}12345678901234"
            },
            payer = new { name = "Cliente Teste", taxId = "12345678901", email = "test@test.com", phone = "11999999999" },
            createdAt = DateTime.UtcNow
        },
        "BOLETO" => new
        {
            id, amount, currency = "BRL", status = "PENDING", method = "BOLETO",
            externalRef, data = new
            {
                method = "BOLETO",
                barcode = $"{id}34191.79001 01043.510047 91020.150008 4 12340000001000",
                boletoUrl = $"https://mock.magicpay/boleto/{id}.pdf"
            },
            payer = new { name = "Cliente Teste", taxId = "12345678901" },
            createdAt = DateTime.UtcNow
        },
        "CREDIT_CARD" => new
        {
            id, amount, currency = "BRL", status = "PAID", method = "CREDIT_CARD",
            externalRef, installments = 1,
            data = new { method = "CREDIT_CARD", message = "Pagamento aprovado com sucesso", cardHolder = "JOHN DOE", cardNumber = "411111******1111" },
            payer = new { name = "Cliente Teste", taxId = "12345678901" },
            paidAt = DateTime.UtcNow, createdAt = DateTime.UtcNow
        },
        _ => new { id, amount, currency = "BRL", status = "PENDING", method, externalRef, createdAt = DateTime.UtcNow }
    };

    var responseJson = JsonSerializer.Serialize(response, new JsonSerializerOptions { DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull });
    payments[id] = JsonDocument.Parse(responseJson).RootElement;
    return Results.Content(responseJson, "application/json", statusCode: 201);
});

app.MapGet("/v1/payment/{id}", (string id) =>
{
    if (payments.TryGetValue(id, out var payment))
        return Results.Json(payment);
    return Results.NotFound(new { error = "not_found", message = "Payment not found" });
});

app.MapPost("/v1/payment/{id}/refund", (string id) =>
{
    return Results.Ok(new { id, status = "REFUNDED" });
});

app.MapPost("/v1/webhook/trigger/{paymentId}", (string paymentId, string status) =>
{
    return Results.Ok(new { triggered = true, paymentId, status });
});

Console.WriteLine("MagicPay Mock running on http://localhost:5199");
app.Run("http://localhost:5199");
