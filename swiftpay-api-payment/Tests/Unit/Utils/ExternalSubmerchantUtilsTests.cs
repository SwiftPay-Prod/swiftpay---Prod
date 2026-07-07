using FluentAssertions;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api_payment.Tests.Unit.Utils;

public sealed class ExternalSubmerchantUtilsTests
{
    [Theory]
    [InlineData(ProviderCategory.PaymentInstitution, true)]
    [InlineData(ProviderCategory.Acquirer, false)]
    public void UsesExternalSubmerchant_ShouldRespectProviderCategory(ProviderCategory category, bool expected)
    {
        var actual = ExternalSubmerchantUtils.UsesExternalSubmerchant(category);

        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData(ExternalSubmerchantStatus.Active, true)]
    [InlineData(ExternalSubmerchantStatus.Pending, false)]
    [InlineData(ExternalSubmerchantStatus.PendingReview, false)]
    [InlineData(ExternalSubmerchantStatus.Rejected, false)]
    public void IsOperational_ShouldOnlyBeTrueForActive(ExternalSubmerchantStatus status, bool expected)
    {
        var actual = ExternalSubmerchantUtils.IsOperational(status);

        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData(ExternalSubmerchantStatus.Active, true)]
    [InlineData(ExternalSubmerchantStatus.Rejected, true)]
    [InlineData(ExternalSubmerchantStatus.Suspended, true)]
    [InlineData(ExternalSubmerchantStatus.Inactive, true)]
    [InlineData(ExternalSubmerchantStatus.Pending, false)]
    [InlineData(ExternalSubmerchantStatus.PendingReview, false)]
    [InlineData(ExternalSubmerchantStatus.NotSubmitted, false)]
    public void IsTerminal_ShouldMatchExpectedStatuses(ExternalSubmerchantStatus status, bool expected)
    {
        var actual = ExternalSubmerchantUtils.IsTerminal(status);

        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData("active", ExternalSubmerchantStatus.Active)]
    [InlineData(" ACTIVE ", ExternalSubmerchantStatus.Active)]
    [InlineData("pending-review", ExternalSubmerchantStatus.PendingReview)]
    [InlineData("pending_review", ExternalSubmerchantStatus.PendingReview)]
    [InlineData("not_submitted", ExternalSubmerchantStatus.NotSubmitted)]
    [InlineData("suspended", ExternalSubmerchantStatus.Suspended)]
    [InlineData("unknown_value", ExternalSubmerchantStatus.Pending)]
    public void Parse_ShouldMapKnownAliasesAndFallback(string input, ExternalSubmerchantStatus expected)
    {
        var actual = ExternalSubmerchantUtils.Parse(input);

        actual.Should().Be(expected);
    }

    [Fact]
    public void Parse_ShouldFallbackToPending_WhenInputIsNullOrWhitespace()
    {
        ExternalSubmerchantUtils.Parse(null).Should().Be(ExternalSubmerchantStatus.Pending);
        ExternalSubmerchantUtils.Parse(string.Empty).Should().Be(ExternalSubmerchantStatus.Pending);
        ExternalSubmerchantUtils.Parse("   ").Should().Be(ExternalSubmerchantStatus.Pending);
    }
}