using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api_payment.Services.Internal.Tracking;

internal static class FacebookCapiTrackingDispatcher
{
    private const string GraphApiVersion = "v25.0";
    private const string DefaultEventSourceUrl = "https://safefypay.com.br";
    private const string DefaultClientIpAddress = "1.1.1.1";
    private const string DefaultClientUserAgent = "Mozilla/5.0";

    public static async Task SendAsync(
        IHttpClientFactory httpClientFactory,
        ILogger logger,
        Guid paymentId,
        PaymentStatus status,
        string pixelId,
        string accessToken,
        string? testEventCode,
        Payment payment,
        string eventName,
        Customer? customer,
        List<OrderItem>? orderItems,
        CancellationToken ct)
    {
        var metadata = TrackingMetadataReader.Parse(payment.Metadata);
        var endpoint = $"https://graph.facebook.com/{GraphApiVersion}/{Uri.EscapeDataString(pixelId)}/events?access_token={Uri.EscapeDataString(accessToken)}";
        var payload = BuildPayload(payment, eventName, customer, orderItems, metadata, testEventCode);

        var client = httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = JsonContent.Create(payload)
        };

        var response = await client.SendAsync(request, ct);
        var body = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            logger.LogError(
                "Failed to send payment event to Facebook CAPI: PaymentId={PaymentId}, Status={Status}, HttpStatus={HttpStatus}, Response={Response}",
                paymentId,
                status,
                (int)response.StatusCode,
                body);

            return;
        }

        if (TryReadEventsReceived(body, out var eventsReceived) && eventsReceived == 0)
        {
            logger.LogError(
                "Facebook CAPI ignored event: PaymentId={PaymentId}, Status={Status}, HttpStatus={HttpStatus}, Response={Response}",
                paymentId,
                status,
                (int)response.StatusCode,
                body);
        }
    }

    private static bool TryReadEventsReceived(string responseBody, out int eventsReceived)
    {
        eventsReceived = -1;

        if (string.IsNullOrWhiteSpace(responseBody))
            return false;

        try
        {
            using var document = JsonDocument.Parse(responseBody);

            if (!document.RootElement.TryGetProperty("events_received", out var eventsReceivedElement))
                return false;

            if (!eventsReceivedElement.TryGetInt32(out eventsReceived))
                return false;

            return true;
        }
        catch
        {
            return false;
        }
    }

    private static FacebookCapiPayload BuildPayload(
        Payment payment,
        string eventName,
        Customer? customer,
        List<OrderItem>? orderItems,
        Dictionary<string, System.Text.Json.JsonElement>? metadata,
        string? testEventCode)
    {
        var eventTime = ResolveEventTime(payment, eventName);
        var eventId = TrackingMetadataReader.ReadFirstString(metadata, "event_id", "eventId") ?? $"{payment.Id}:{eventName}";
        var eventSourceUrl = ResolveEventSourceUrl(payment, metadata);
        var referrerUrl = TrackingMetadataReader.ReadFirstString(metadata, "referrer_url", "referrerUrl");

        var userData = new FacebookCapiUserData
        {
            Em = HashIfPresent(customer?.Email),
            Ph = HashIfPresent(customer?.Phone),
            Fn = HashIfPresent(GetFirstName(customer?.Name)),
            Ln = HashIfPresent(GetLastName(customer?.Name)),
            Ct = HashIfPresent(customer?.AddressCity),
            St = HashIfPresent(customer?.AddressState),
            Zp = HashIfPresent(customer?.AddressPostalCode),
            Country = HashIfPresent(customer?.AddressCountry),
            ExternalId = HashIfPresent(ResolveExternalIdSeed(payment, customer)),
            Fbc = TrackingMetadataReader.ReadFirstString(metadata, "fbc"),
            Fbp = TrackingMetadataReader.ReadFirstString(metadata, "fbp"),
            ClientIpAddress = ResolveClientIpAddress(metadata),
            ClientUserAgent = ResolveClientUserAgent(metadata),
        };

        var contents = BuildContents(payment, orderItems);
        var customData = new FacebookCapiCustomData
        {
            Value = decimal.Round(payment.Amount / 100m, 2, MidpointRounding.AwayFromZero),
            Currency = payment.Currency.ToString(),
            OrderId = payment.Id.ToString(),
            ContentName = string.IsNullOrWhiteSpace(payment.Description) ? "Pagamento" : payment.Description,
            ContentType = contents.Count > 0 ? "product" : null,
            Contents = contents.Count > 0 ? contents : null,
            NumItems = contents.Count > 0 ? contents.Sum(x => x.Quantity) : null,
            PaymentMethod = MapPaymentMethod(payment.Method),
            Status = payment.Status.ToString(),
        };

        var data = new FacebookCapiServerEvent
        {
            EventName = eventName,
            EventTime = eventTime,
            EventId = eventId,
            ActionSource = "website",
            EventSourceUrl = eventSourceUrl,
            ReferrerUrl = referrerUrl,
            UserData = userData,
            CustomData = customData,
        };

        return new FacebookCapiPayload
        {
            Data = [data],
            TestEventCode = string.IsNullOrWhiteSpace(testEventCode) ? null : testEventCode,
        };
    }

    private static long ResolveEventTime(Payment payment, string eventName)
    {
        var dt = eventName switch
        {
            "Purchase" => payment.CompletedAt ?? payment.CreatedAt,
            "Refunded" => payment.RefundedAt ?? payment.UpdatedAt,
            "Chargeback" => payment.UpdatedAt,
            "PaymentFailed" => payment.UpdatedAt,
            _ => payment.CreatedAt,
        };

        return new DateTimeOffset(DateTime.SpecifyKind(dt, DateTimeKind.Utc)).ToUnixTimeSeconds();
    }

    private static string? ResolveEventSourceUrl(Payment payment, Dictionary<string, System.Text.Json.JsonElement>? metadata)
    {
        return TrackingMetadataReader.ReadFirstString(metadata, "event_source_url", "eventSourceUrl")
            ?? payment.RequestOrigin
            ?? TrackingMetadataReader.ReadFirstString(metadata, "origin", "source_url", "sourceUrl")
            ?? DefaultEventSourceUrl;
    }

    private static string ResolveExternalIdSeed(Payment payment, Customer? customer)
    {
        // Prioridade solicitada: ExternalId do pagamento -> CustomerId.
        // Fallback final para evitar payload sem customer identifiers.
        return payment.ExternalId
            ?? payment.CustomerId?.ToString()
            ?? customer?.ExternalId
            ?? payment.Id.ToString();
    }

    private static string? ResolveClientIpAddress(Dictionary<string, System.Text.Json.JsonElement>? metadata)
    {
        var rawIp = TrackingMetadataReader.ReadFirstString(
            metadata,
            "client_ip_address",
            "clientIpAddress",
            "ip",
            "ipAddress",
            "x_forwarded_for",
            "x-forwarded-for");

        if (string.IsNullOrWhiteSpace(rawIp))
            return DefaultClientIpAddress;

        // If x-forwarded-for style list is provided, use the first hop.
        return rawIp.Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(ip => ip.Trim())
            .FirstOrDefault(ip => !string.IsNullOrWhiteSpace(ip))
            ?? DefaultClientIpAddress;
    }

    private static string? ResolveClientUserAgent(Dictionary<string, System.Text.Json.JsonElement>? metadata)
    {
        return TrackingMetadataReader.ReadFirstString(
            metadata,
            "client_user_agent",
            "clientUserAgent",
            "user_agent",
            "userAgent")
            ?? DefaultClientUserAgent;
    }

    private static List<FacebookCapiContentItem> BuildContents(Payment payment, List<OrderItem>? orderItems)
    {
        if (orderItems == null || orderItems.Count == 0)
        {
            return [];
        }

        return orderItems
            .OrderBy(x => x.Id)
            .Select(x => new FacebookCapiContentItem
            {
                Id = x.ProductId.ToString(),
                Quantity = x.Quantity,
                ItemPrice = decimal.Round(x.UnitPrice / 100m, 2, MidpointRounding.AwayFromZero),
                Title = string.IsNullOrWhiteSpace(x.ProductName) ? payment.Description ?? "Pagamento" : x.ProductName,
            })
            .ToList();
    }

    private static string MapPaymentMethod(PaymentMethod method)
    {
        return method switch
        {
            PaymentMethod.Pix => "pix",
            PaymentMethod.Boleto => "boleto",
            PaymentMethod.CreditCard => "credit_card",
            _ => "pix",
        };
    }

    private static string? HashIfPresent(string? raw)
    {
        var normalized = NormalizeValue(raw);
        if (string.IsNullOrWhiteSpace(normalized))
            return null;

        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static string? NormalizeValue(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        return raw.Trim().ToLowerInvariant();
    }

    private static string? GetFirstName(string? fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            return null;

        return fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
    }

    private static string? GetLastName(string? fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            return null;

        var parts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return parts.Length > 1 ? parts[^1] : null;
    }

    private sealed class FacebookCapiPayload
    {
        [JsonPropertyName("data")]
        public List<FacebookCapiServerEvent> Data { get; set; } = [];

        [JsonPropertyName("test_event_code")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? TestEventCode { get; set; }
    }

    private sealed class FacebookCapiServerEvent
    {
        [JsonPropertyName("event_name")]
        public string EventName { get; set; } = string.Empty;

        [JsonPropertyName("event_time")]
        public long EventTime { get; set; }

        [JsonPropertyName("event_id")]
        public string EventId { get; set; } = string.Empty;

        [JsonPropertyName("action_source")]
        public string ActionSource { get; set; } = "website";

        [JsonPropertyName("event_source_url")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? EventSourceUrl { get; set; }

        [JsonPropertyName("referrer_url")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? ReferrerUrl { get; set; }

        [JsonPropertyName("user_data")]
        public FacebookCapiUserData UserData { get; set; } = new();

        [JsonPropertyName("custom_data")]
        public FacebookCapiCustomData CustomData { get; set; } = new();
    }

    private sealed class FacebookCapiUserData
    {
        [JsonPropertyName("em")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Em { get; set; }

        [JsonPropertyName("ph")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Ph { get; set; }

        [JsonPropertyName("fn")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Fn { get; set; }

        [JsonPropertyName("ln")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Ln { get; set; }

        [JsonPropertyName("ct")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Ct { get; set; }

        [JsonPropertyName("st")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? St { get; set; }

        [JsonPropertyName("zp")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Zp { get; set; }

        [JsonPropertyName("country")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Country { get; set; }

        [JsonPropertyName("external_id")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? ExternalId { get; set; }

        [JsonPropertyName("fbc")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Fbc { get; set; }

        [JsonPropertyName("fbp")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Fbp { get; set; }

        [JsonPropertyName("client_ip_address")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? ClientIpAddress { get; set; }

        [JsonPropertyName("client_user_agent")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? ClientUserAgent { get; set; }
    }

    private sealed class FacebookCapiCustomData
    {
        [JsonPropertyName("value")]
        public decimal Value { get; set; }

        [JsonPropertyName("currency")]
        public string Currency { get; set; } = "BRL";

        [JsonPropertyName("order_id")]
        public string OrderId { get; set; } = string.Empty;

        [JsonPropertyName("content_name")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? ContentName { get; set; }

        [JsonPropertyName("content_type")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? ContentType { get; set; }

        [JsonPropertyName("contents")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<FacebookCapiContentItem>? Contents { get; set; }

        [JsonPropertyName("num_items")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? NumItems { get; set; }

        [JsonPropertyName("payment_method")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? PaymentMethod { get; set; }

        [JsonPropertyName("status")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Status { get; set; }
    }

    private sealed class FacebookCapiContentItem
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("quantity")]
        public int Quantity { get; set; }

        [JsonPropertyName("item_price")]
        public decimal ItemPrice { get; set; }

        [JsonPropertyName("title")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Title { get; set; }
    }
}
