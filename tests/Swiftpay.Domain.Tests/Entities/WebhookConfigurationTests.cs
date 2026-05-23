using Swiftpay.Domain.Entities;

namespace Swiftpay.Domain.Tests.Entities;

public class WebhookConfigurationTests
{
    [Fact]
    public void CreateWebhookConfig_Should_HaveActiveStatus()
    {
        var c = new WebhookConfiguration
        {
            Id = Guid.NewGuid(),
            MerchantId = Guid.NewGuid(),
            Url = "https://example.com/webhook",
            Secret = "secret123"
        };

        c.IsActive.Should().BeTrue();
    }

    [Fact]
    public void CreateWebhookConfig_Should_HaveDefaultEvents()
    {
        var c = new WebhookConfiguration
        {
            Id = Guid.NewGuid(),
            MerchantId = Guid.NewGuid(),
            Url = "https://example.com/webhook",
            Secret = "secret123"
        };

        c.Events.Should().Contain("payment.completed");
    }
}
