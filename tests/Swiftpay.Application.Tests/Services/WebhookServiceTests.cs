using Swiftpay.Api.Core.Services;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Application.Tests.Services;

public class WebhookServiceTests
{
    [Fact]
    public void ComputeHmacSha256_Should_ReturnValidHash()
    {
        var payload = "{\"test\":true}";
        var secret = "my_secret";

        var result = InvokeComputeHmacSha256(payload, secret);

        result.Should().NotBeNullOrEmpty();
        result.Length.Should().Be(64);
    }

    private static string InvokeComputeHmacSha256(string payload, string secret)
    {
        var method = typeof(WebhookService).GetMethod("ComputeHmacSha256",
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
        return (string)method!.Invoke(null, new object[] { payload, secret })!;
    }
}
