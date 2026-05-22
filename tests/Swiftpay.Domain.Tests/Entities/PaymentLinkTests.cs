namespace Swiftpay.Domain.Tests.Entities;

public class PaymentLinkTests
{
    [Fact]
    public void CreatePaymentLink_Should_SetAmountInCents_When_ValidInput()
    {
        var link = new PaymentLink
        {
            Id = Guid.NewGuid(),
            Title = "Test Link",
            Description = "Test Description",
            Amount = new Money(3000),
            Slug = "abcdef12",
            IsActive = true,
            CompanyId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
        };

        link.Amount.AmountInCents.Should().Be(3000);
        link.Title.Should().Be("Test Link");
        link.Slug.Should().Be("abcdef12");
        link.IsActive.Should().BeTrue();
        link.UsesCount.Should().Be(0);
    }

    [Fact]
    public void PaymentLink_Should_BeInactive_When_Deactivated()
    {
        var link = new PaymentLink
        {
            Id = Guid.NewGuid(),
            Title = "Test",
            Amount = new Money(1000),
            Slug = "slug1234",
            IsActive = true,
            CompanyId = Guid.NewGuid(),
        };

        link.IsActive = false;

        link.IsActive.Should().BeFalse();
    }

    [Fact]
    public void PaymentLink_Should_BeExpired_When_ExpiresAtPassed()
    {
        var link = new PaymentLink
        {
            ExpiresAt = DateTime.UtcNow.AddHours(-1),
            IsActive = true,
        };

        link.IsExpired.Should().BeTrue();
    }

    [Fact]
    public void PaymentLink_Should_BeExhausted_When_MaxUsesReached()
    {
        var link = new PaymentLink
        {
            MaxUses = 5,
            UsesCount = 5,
        };

        link.IsExhausted.Should().BeTrue();
    }
}
