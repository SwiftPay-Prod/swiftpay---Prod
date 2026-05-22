namespace Swiftpay.Domain.Tests.ValueObjects;

public class MoneyTests
{
    [Fact]
    public void Money_Should_StoreAmountInCents()
    {
        var money = new Money(3000);
        money.AmountInCents.Should().Be(3000);
    }

    [Fact]
    public void Money_FromDecimal_Should_ConvertCorrectly()
    {
        var money = Money.FromDecimal(30.00m);
        money.AmountInCents.Should().Be(3000);
    }

    [Fact]
    public void Money_ToDecimal_Should_ConvertCorrectly()
    {
        var money = new Money(3000);
        money.ToDecimal().Should().Be(30.00m);
    }

    [Fact]
    public void Money_Equality_Should_Work()
    {
        var a = new Money(1000);
        var b = new Money(1000);
        (a == b).Should().BeTrue();
    }

    [Fact]
    public void Money_Addition_Should_Work()
    {
        var a = new Money(1000);
        var b = new Money(2000);
        var sum = a + b;
        sum.AmountInCents.Should().Be(3000);
    }

    [Fact]
    public void Money_Subtraction_Should_Work()
    {
        var a = new Money(3000);
        var b = new Money(1000);
        var diff = a - b;
        diff.AmountInCents.Should().Be(2000);
    }

    [Fact]
    public void Money_Zero_Should_Be_Default()
    {
        Money defaultMoney = default;
        defaultMoney.AmountInCents.Should().Be(0);
    }

    [Fact]
    public void Money_Zero_Static_Should_BeZero()
    {
        Money.Zero.AmountInCents.Should().Be(0);
    }

    [Fact]
    public void Money_ToString_Should_FormatCorrectly()
    {
        var money = new Money(3050);
        money.ToString().Should().Be("R$ 30,50");
    }
}
