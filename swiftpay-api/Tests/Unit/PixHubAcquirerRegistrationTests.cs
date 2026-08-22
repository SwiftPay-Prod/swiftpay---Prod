using swiftpay_api_core.Constants;
using swiftpay_api_core.Models.Database;
using Xunit;

namespace swiftpay_api.Tests.Unit;

public sealed class PixHubAcquirerRegistrationTests
{
    [Fact]
    public void SystemId_IsStableAndReserved()
    {
        Assert.Equal(Guid.Parse("00000000-0000-0000-0000-000000000213"), SystemAcquirerIds.PixHub);
    }

    [Fact]
    public void Metadata_UsesDocumentedApiAndHmacWebhook()
    {
        var metadata = AcquirerDefaultsConstants.GetMetadata(AcquirerType.PixHub);

        Assert.Equal("https://api.usepixhub.com", metadata.ApiBaseUrlProduction);
        Assert.Equal("https://api.usepixhub.com", metadata.ApiBaseUrlSandbox);
        Assert.Equal("https://docs.usepixhub.com/", metadata.DocumentationUrl);
        Assert.Equal(WebhookAuthMode.HmacSha256, metadata.WebhookAuthMode);
    }
}
