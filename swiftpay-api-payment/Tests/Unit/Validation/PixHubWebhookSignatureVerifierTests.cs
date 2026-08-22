using FluentAssertions;
using swiftpay_api_payment.Clients.PixHub;
using Xunit;

namespace swiftpay_api_payment.Tests.Unit.Validation;

public sealed class PixHubWebhookSignatureVerifierTests
{
    private static readonly DateTimeOffset Now = DateTimeOffset.FromUnixTimeSeconds(1_700_000_000);
    private const string Secret = "signature-secret";
    private const string Payload = "{\"event\":\"transaction_paid\",\"transaction\":{\"id\":\"trx_123\"}}";

    [Fact]
    public void Verify_WithMatchingSignature_ReturnsTrue()
    {
        var signature = PixHubWebhookSignatureVerifier.CreateSignature(Payload, Secret, Now.ToUnixTimeSeconds());

        var valid = PixHubWebhookSignatureVerifier.Verify(Payload, signature, Secret, Now);

        valid.Should().BeTrue();
    }

    [Fact]
    public void Verify_WithTamperedPayload_ReturnsFalse()
    {
        var signature = PixHubWebhookSignatureVerifier.CreateSignature(Payload, Secret, Now.ToUnixTimeSeconds());

        var valid = PixHubWebhookSignatureVerifier.Verify(Payload + " ", signature, Secret, Now);

        valid.Should().BeFalse();
    }

    [Fact]
    public void Verify_WithExpiredTimestamp_ReturnsFalse()
    {
        var oldTimestamp = Now.AddMinutes(-6).ToUnixTimeSeconds();
        var signature = PixHubWebhookSignatureVerifier.CreateSignature(Payload, Secret, oldTimestamp);

        var valid = PixHubWebhookSignatureVerifier.Verify(Payload, signature, Secret, Now);

        valid.Should().BeFalse();
    }

    [Theory]
    [InlineData("")]
    [InlineData("invalid")]
    [InlineData("t=abc,v1=hash")]
    [InlineData("t=9223372036854775807,v1=0000000000000000000000000000000000000000000000000000000000000000")]
    public void Verify_WithMalformedHeader_ReturnsFalse(string signature)
    {
        PixHubWebhookSignatureVerifier.Verify(Payload, signature, Secret, Now).Should().BeFalse();
    }
}
