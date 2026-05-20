using System.Text.Json;
using FluentAssertions;
using safefy_api_payment.Clients.Common;

namespace safefy_api_payment.Tests.Unit.Clients.Common;

public sealed class AcquirerJsonReaderTests
{
    [Fact]
    public void ExtractPayload_ShouldReturnNestedObject_WhenKeyExists()
    {
        const string json = "{\"data\":{\"id\":\"abc\"}}";
        using var doc = JsonDocument.Parse(json);

        var payload = AcquirerJsonReader.ExtractPayload(doc.RootElement, "data");

        AcquirerJsonReader.ReadString(payload, "id").Should().Be("abc");
    }

    [Fact]
    public void ReadString_ShouldSupportCaseInsensitiveLookup()
    {
        const string json = "{\"CorrelationID\":\"corr_123\"}";
        using var doc = JsonDocument.Parse(json);

        var value = AcquirerJsonReader.ReadString(doc.RootElement, "correlationId");

        value.Should().Be("corr_123");
    }

    [Fact]
    public void ReadDocument_ShouldResolveNestedDocumentObject()
    {
        const string json = "{\"customer\":{\"document\":{\"number\":\"12345678901\"}}}";
        using var doc = JsonDocument.Parse(json);
        var customer = AcquirerJsonReader.ExtractPayload(doc.RootElement, "customer");

        var value = AcquirerJsonReader.ReadDocument(customer, "document");

        value.Should().Be("12345678901");
    }

    [Fact]
    public void TryParseJson_ShouldReturnFalse_WhenInputIsInvalid()
    {
        var ok = AcquirerJsonReader.TryParseJson("{invalid", out _);

        ok.Should().BeFalse();
    }
}
