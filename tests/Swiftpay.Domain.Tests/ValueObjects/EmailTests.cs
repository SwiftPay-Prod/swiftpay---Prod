namespace Swiftpay.Domain.Tests.ValueObjects;

public class EmailTests
{
    [Fact]
    public void Email_Create_Should_StoreAddress()
    {
        var email = Email.Create("test@example.com");
        email.Address.Should().Be("test@example.com");
    }

    [Fact]
    public void Email_Create_Should_TrimAndLowercase()
    {
        var email = Email.Create("  Test@Example.COM  ");
        email.Address.Should().Be("test@example.com");
    }

    [Fact]
    public void Email_Create_Should_Throw_When_Empty()
    {
        Action act = () => Email.Create("");
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Email_Create_Should_Throw_When_NoAtSymbol()
    {
        Action act = () => Email.Create("invalid");
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Email_Equality_Should_Work()
    {
        var a = Email.Create("user@example.com");
        var b = Email.Create("user@example.com");
        (a == b).Should().BeTrue();
    }
}
