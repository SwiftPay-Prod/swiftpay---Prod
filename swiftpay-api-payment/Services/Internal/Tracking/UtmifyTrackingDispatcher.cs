using System.Net.Http.Json;
using System.Text.Json.Serialization;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_payment.Services.Internal.Tracking;

internal static class UtmifyTrackingDispatcher
{
    private const string UtmifyOrdersEndpoint = "https://api.utmify.com.br/api-credentials/orders";

    public static async Task SendAsync(
        IHttpClientFactory httpClientFactory,
        ILogger logger,
        Guid paymentId,
        PaymentStatus status,
        string apiToken,
        Payment payment,
        string utmifyStatus,
        Customer? customer,
        List<OrderItem>? orderItems,
        CancellationToken ct)
    {
        var payload = BuildPayload(payment, utmifyStatus, customer, orderItems);
        var client = httpClientFactory.CreateClient("utmify-integration");

        using var request = new HttpRequestMessage(HttpMethod.Post, UtmifyOrdersEndpoint)
        {
            Content = JsonContent.Create(payload)
        };

        request.Headers.Add("x-api-token", apiToken);
        var response = await client.SendAsync(request, ct);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            logger.LogError(
                "Failed to send payment event to Utmify: PaymentId={PaymentId}, Status={Status}, HttpStatus={HttpStatus}, Response={Response}",
                paymentId,
                status,
                (int)response.StatusCode,
                body);
        }
    }

    private static UtmifyOrderPayload BuildPayload(
        Payment payment,
        string status,
        Customer? customer,
        List<OrderItem>? orderItems)
    {
        var metadata = TrackingMetadataReader.Parse(payment.Metadata);

        return new UtmifyOrderPayload
        {
            Platform = "SwiftPayPay",
            OrderId = payment.Id.ToString(),
            PaymentMethod = payment.Method switch
            {
                PaymentMethod.Pix => "pix",
                PaymentMethod.Boleto => "boleto",
                PaymentMethod.CreditCard => "cartao",
                _ => "pix"
            },
            Status = status,
            CreatedAt = payment.CreatedAt,
            ApprovedDate = payment.CompletedAt,
            RefundedAt = payment.RefundedAt,
            Total = decimal.Round(payment.Amount / 100m, 2, MidpointRounding.AwayFromZero),
            Shipping = 0,
            Customer = new UtmifyCustomerPayload
            {
                Name = ResolveCustomerName(customer),
                Email = ResolveCustomerEmail(customer, payment),
                Phone = customer?.Phone,
                Document = customer?.Document,
            },
            Products = BuildProducts(payment, orderItems),
            Commission = new UtmifyCommissionPayload
            {
                TotalPriceInCents = payment.Amount,
                GatewayFeeInCents = payment.PlatformFee + payment.CheckoutTemplateFee,
                UserCommissionInCents = payment.NetAmount,
            },
            TrackingParameters = new UtmifyTrackingParametersPayload
            {
                Src = TrackingMetadataReader.ReadString(metadata, "src"),
                Sck = TrackingMetadataReader.ReadString(metadata, "sck"),
                UtmSource = TrackingMetadataReader.ReadString(metadata, "utm_source"),
                UtmCampaign = TrackingMetadataReader.ReadString(metadata, "utm_campaign"),
                UtmMedium = TrackingMetadataReader.ReadString(metadata, "utm_medium"),
                UtmContent = TrackingMetadataReader.ReadString(metadata, "utm_content"),
                UtmTerm = TrackingMetadataReader.ReadString(metadata, "utm_term"),
            }
        };
    }

    private static List<UtmifyProductPayload> BuildProducts(Payment payment, List<OrderItem>? orderItems)
    {
        if (orderItems != null && orderItems.Count > 0)
        {
            return orderItems
                .OrderBy(i => i.Id)
                .Select(item => new UtmifyProductPayload
                {
                    Id = item.ProductId.ToString(),
                    Name = item.ProductName,
                    PlanId = (item.VariantId ?? item.ProductId).ToString(),
                    PlanName = string.IsNullOrWhiteSpace(item.VariantName) ? item.ProductName : item.VariantName,
                    Quantity = item.Quantity,
                    PriceInCents = item.UnitPrice,
                })
                .ToList();
        }

        return
        [
            new UtmifyProductPayload
            {
                Id = payment.Id.ToString(),
                Name = string.IsNullOrWhiteSpace(payment.Description) ? "Pagamento" : payment.Description,
                PlanId = payment.Id.ToString(),
                PlanName = string.IsNullOrWhiteSpace(payment.Description) ? "Pagamento" : payment.Description,
                Quantity = 1,
                PriceInCents = payment.Amount,
            }
        ];
    }

    private static string ResolveCustomerName(Customer? customer)
    {
        if (!string.IsNullOrWhiteSpace(customer?.Name))
            return customer.Name.Trim();

        return "Cliente SwiftPay";
    }

    private static string ResolveCustomerEmail(Customer? customer, Payment payment)
    {
        if (!string.IsNullOrWhiteSpace(customer?.Email))
            return customer.Email.Trim();

        return $"customer-{payment.Id:N}@swiftpay.local";
    }

    private sealed class UtmifyOrderPayload
    {
        [JsonPropertyName("platform")]
        public string Platform { get; set; } = "SwiftPayPay";

        [JsonPropertyName("orderId")]
        public string OrderId { get; set; } = string.Empty;

        [JsonPropertyName("paymentMethod")]
        public string PaymentMethod { get; set; } = "pix";

        [JsonPropertyName("status")]
        public string Status { get; set; } = "waiting_payment";

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }

        [JsonPropertyName("approvedDate")]
        public DateTime? ApprovedDate { get; set; }

        [JsonPropertyName("refundedAt")]
        public DateTime? RefundedAt { get; set; }

        [JsonPropertyName("total")]
        public decimal Total { get; set; }

        [JsonPropertyName("shipping")]
        public decimal Shipping { get; set; }

        [JsonPropertyName("customer")]
        public UtmifyCustomerPayload Customer { get; set; } = new();

        [JsonPropertyName("products")]
        public List<UtmifyProductPayload> Products { get; set; } = [];

        [JsonPropertyName("commission")]
        public UtmifyCommissionPayload Commission { get; set; } = new();

        [JsonPropertyName("trackingParameters")]
        public UtmifyTrackingParametersPayload TrackingParameters { get; set; } = new();
    }

    private sealed class UtmifyCustomerPayload
    {
        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("phone")]
        public string? Phone { get; set; }

        [JsonPropertyName("document")]
        public string? Document { get; set; }
    }

    private sealed class UtmifyProductPayload
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

        [JsonPropertyName("priceInCents")]
        public long PriceInCents { get; set; }
    }

    private sealed class UtmifyCommissionPayload
    {
        [JsonPropertyName("totalPriceInCents")]
        public long TotalPriceInCents { get; set; }

        [JsonPropertyName("gatewayFeeInCents")]
        public long GatewayFeeInCents { get; set; }

        [JsonPropertyName("userCommissionInCents")]
        public long UserCommissionInCents { get; set; }
    }

    private sealed class UtmifyTrackingParametersPayload
    {
        [JsonPropertyName("src")]
        public string? Src { get; set; }

        [JsonPropertyName("sck")]
        public string? Sck { get; set; }

        [JsonPropertyName("utm_source")]
        public string? UtmSource { get; set; }

        [JsonPropertyName("utm_campaign")]
        public string? UtmCampaign { get; set; }

        [JsonPropertyName("utm_medium")]
        public string? UtmMedium { get; set; }

        [JsonPropertyName("utm_content")]
        public string? UtmContent { get; set; }

        [JsonPropertyName("utm_term")]
        public string? UtmTerm { get; set; }
    }
}
