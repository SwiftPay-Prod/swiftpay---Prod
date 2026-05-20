using System.Net.Http.Json;
using System.Text.Json.Serialization;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api_payment.Services.Internal.Tracking;

internal static class OtimizeyTrackingDispatcher
{
    private const string OtimizeyCredentialEndpointTemplate = "https://api.otimizey.com.br/webhooks/credential/{0}";

    public static async Task SendAsync(
        IHttpClientFactory httpClientFactory,
        ILogger logger,
        Guid paymentId,
        PaymentStatus status,
        string credentialId,
        Payment payment,
        string otimizeyStatus,
        Customer? customer,
        List<OrderItem>? orderItems,
        CancellationToken ct)
    {
        var payload = BuildPayload(payment, otimizeyStatus, customer, orderItems);
        var client = httpClientFactory.CreateClient();
        var endpoint = string.Format(OtimizeyCredentialEndpointTemplate, Uri.EscapeDataString(credentialId));

        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = JsonContent.Create(payload)
        };

        var response = await client.SendAsync(request, ct);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            logger.LogError(
                "Failed to send payment event to Otimizey: PaymentId={PaymentId}, Status={Status}, HttpStatus={HttpStatus}, Response={Response}",
                paymentId,
                status,
                (int)response.StatusCode,
                body);
        }
    }

    private static OtimizeyOrderPayload BuildPayload(
        Payment payment,
        string status,
        Customer? customer,
        List<OrderItem>? orderItems)
    {
        var metadata = TrackingMetadataReader.Parse(payment.Metadata);

        return new OtimizeyOrderPayload
        {
            ExternalUserRef = ResolveCustomerEmail(customer, payment),
            Products = BuildProducts(payment, orderItems),
            OrderId = payment.Id.ToString(),
            PaymentMethod = GetOtimizeyPaymentMethod(payment.Method),
            Status = status,
            TotalPrice = decimal.Round(payment.Amount / 100m, 2, MidpointRounding.AwayFromZero),
            ReceivedPrice = decimal.Round(payment.NetAmount / 100m, 2, MidpointRounding.AwayFromZero),
            Sck = TrackingMetadataReader.ReadFirstString(metadata, "sck"),
            Src = TrackingMetadataReader.ReadFirstString(metadata, "src"),
            UtmSource = TrackingMetadataReader.ReadFirstString(metadata, "utmSource", "utm_source"),
            UtmMedium = TrackingMetadataReader.ReadFirstString(metadata, "utmMedium", "utm_medium"),
            UtmCampaign = TrackingMetadataReader.ReadFirstString(metadata, "utmCampaign", "utm_campaign"),
            UtmContent = TrackingMetadataReader.ReadFirstString(metadata, "utmContent", "utm_content"),
            Name = ResolveCustomerName(customer),
            Email = ResolveCustomerEmail(customer, payment),
            Phone = customer?.Phone,
            Cpf = customer?.Document,
            PostalCode = customer?.AddressPostalCode,
            BirthDate = null,
        };
    }

    private static List<OtimizeyProductPayload> BuildProducts(Payment payment, List<OrderItem>? orderItems)
    {
        if (orderItems != null && orderItems.Count > 0)
        {
            var orderedItems = orderItems.OrderBy(i => i.Id).ToList();
            var totalGrossInCents = orderedItems.Sum(i => i.UnitPrice * i.Quantity);

            if (totalGrossInCents <= 0)
                totalGrossInCents = payment.Amount;

            var remainingNetInCents = payment.NetAmount;
            var products = new List<OtimizeyProductPayload>(orderedItems.Count);

            for (var index = 0; index < orderedItems.Count; index++)
            {
                var item = orderedItems[index];
                var itemGrossInCents = item.UnitPrice * item.Quantity;

                long itemNetInCents;
                if (index == orderedItems.Count - 1)
                {
                    itemNetInCents = remainingNetInCents;
                }
                else
                {
                    itemNetInCents = (long)Math.Floor((decimal)itemGrossInCents * payment.NetAmount / totalGrossInCents);
                    remainingNetInCents -= itemNetInCents;
                }

                products.Add(new OtimizeyProductPayload
                {
                    Id = item.ProductId.ToString(),
                    Name = item.ProductName,
                    PlanId = (item.VariantId ?? item.ProductId).ToString(),
                    PlanName = string.IsNullOrWhiteSpace(item.VariantName) ? item.ProductName : item.VariantName,
                    Quantity = item.Quantity,
                    Price = decimal.Round(itemNetInCents / 100m, 2, MidpointRounding.AwayFromZero),
                });
            }

            return products;
        }

        return
        [
            new OtimizeyProductPayload
            {
                Id = payment.Id.ToString(),
                Name = string.IsNullOrWhiteSpace(payment.Description) ? "Pagamento" : payment.Description,
                PlanId = payment.Id.ToString(),
                PlanName = string.IsNullOrWhiteSpace(payment.Description) ? "Pagamento" : payment.Description,
                Quantity = 1,
                Price = decimal.Round(payment.NetAmount / 100m, 2, MidpointRounding.AwayFromZero),
            }
        ];
    }

    private static string ResolveCustomerName(Customer? customer)
    {
        if (!string.IsNullOrWhiteSpace(customer?.Name))
            return customer.Name.Trim();

        return "Cliente Safefy";
    }

    private static string ResolveCustomerEmail(Customer? customer, Payment payment)
    {
        if (!string.IsNullOrWhiteSpace(customer?.Email))
            return customer.Email.Trim();

        return $"customer-{payment.Id:N}@safefy.local";
    }

    private static string GetOtimizeyPaymentMethod(PaymentMethod method)
    {
        return method switch
        {
            PaymentMethod.Pix => "pix",
            PaymentMethod.Boleto => "boleto",
            PaymentMethod.CreditCard => "credit_card",
            _ => "pix"
        };
    }

    private sealed class OtimizeyOrderPayload
    {
        [JsonPropertyName("externalUserRef")]
        public string ExternalUserRef { get; set; } = string.Empty;

        [JsonPropertyName("products")]
        public List<OtimizeyProductPayload> Products { get; set; } = [];

        [JsonPropertyName("orderId")]
        public string OrderId { get; set; } = string.Empty;

        [JsonPropertyName("paymentMethod")]
        public string PaymentMethod { get; set; } = "pix";

        [JsonPropertyName("status")]
        public string Status { get; set; } = "waiting_payment";

        [JsonPropertyName("totalPrice")]
        public decimal TotalPrice { get; set; }

        [JsonPropertyName("receivedPrice")]
        public decimal ReceivedPrice { get; set; }

        [JsonPropertyName("sck")]
        public string? Sck { get; set; }

        [JsonPropertyName("src")]
        public string? Src { get; set; }

        [JsonPropertyName("utmSource")]
        public string? UtmSource { get; set; }

        [JsonPropertyName("utmMedium")]
        public string? UtmMedium { get; set; }

        [JsonPropertyName("utmCampaign")]
        public string? UtmCampaign { get; set; }

        [JsonPropertyName("utmContent")]
        public string? UtmContent { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("phone")]
        public string? Phone { get; set; }

        [JsonPropertyName("cpf")]
        public string? Cpf { get; set; }

        [JsonPropertyName("postalCode")]
        public string? PostalCode { get; set; }

        [JsonPropertyName("birthDate")]
        public string? BirthDate { get; set; }
    }

    private sealed class OtimizeyProductPayload
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("planId")]
        public string PlanId { get; set; } = string.Empty;

        [JsonPropertyName("planName")]
        public string PlanName { get; set; } = string.Empty;

        [JsonPropertyName("quantity")]
        public int Quantity { get; set; }

        [JsonPropertyName("price")]
        public decimal Price { get; set; }
    }
}
