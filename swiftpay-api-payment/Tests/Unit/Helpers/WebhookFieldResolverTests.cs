using System.Text.Json;
using FluentAssertions;
using swiftpay_api_payment.Services.Helpers;

namespace swiftpay_api_payment.Tests.Unit.Helpers;

public sealed class WebhookFieldResolverTests
{
    [Fact]
    public void FirstNonEmpty_ShouldReturnFirstNonBlankValue()
    {
        var result = WebhookFieldResolver.FirstNonEmpty(null, "", "   ", "tx_123", "tx_456");

        result.Should().Be("tx_123");
    }

    [Fact]
    public void FirstNonEmptyFromChain_ShouldResolveNestedValue()
    {
        var payload = new TestNode
        {
            Data = new TestNode
            {
                CorrelationId = "corr_nested"
            }
        };

        var result = WebhookFieldResolver.FirstNonEmptyFromChain(payload, x => x.Data, x => x.TransactionId, x => x.CorrelationId);

        result.Should().Be("corr_nested");
    }

    [Fact]
    public void FirstKnownFromChain_ShouldSkipUnknownAndReturnKnownEnum()
    {
        var payload = new TestNode
        {
            Status = TestStatus.Unknown,
            Data = new TestNode
            {
                Status = TestStatus.Completed
            }
        };

        var result = WebhookFieldResolver.FirstKnownFromChain(payload, x => x.Data, TestStatus.Unknown, x => x.Status);

        result.Should().Be(TestStatus.Completed);
    }

    [Fact]
    public void FirstValueFromChain_ShouldResolveNullableStructValue()
    {
        var paidAt = DateTime.UtcNow;
        var payload = new TestNode
        {
            Data = new TestNode
            {
                PaidAt = paidAt
            }
        };

        var result = WebhookFieldResolver.FirstValueFromChain(payload, x => x.Data, x => x.PaidAt);

        result.Should().Be(paidAt);
    }

    [Fact]
    public void FirstJsonString_ShouldReadCaseInsensitiveProperty()
    {
        var json = "{\"CorrelationID\":\"abc123\"}";
        using var doc = JsonDocument.Parse(json);

        var result = WebhookFieldResolver.FirstJsonString(doc.RootElement, "correlationId");

        result.Should().Be("abc123");
    }

    private sealed class TestNode
    {
        public string? TransactionId { get; set; }
        public string? CorrelationId { get; set; }
        public TestStatus? Status { get; set; }
        public DateTime? PaidAt { get; set; }
        public TestNode? Data { get; set; }
    }

    private enum TestStatus
    {
        Unknown,
        Completed
    }
}
