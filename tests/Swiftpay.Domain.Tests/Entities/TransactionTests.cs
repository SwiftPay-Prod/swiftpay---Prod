namespace Swiftpay.Domain.Tests.Entities;

public class TransactionTests
{
    [Fact]
    public void CreateTransaction_Should_HavePendingStatus_When_Created()
    {
        var tx = new Transaction
        {
            Id = Guid.NewGuid(),
            Amount = new Money(5000),
            Type = TransactionType.Payment,
            Status = TransactionStatus.Pending,
            Method = PaymentMethod.Pix,
            CompanyId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
        };

        tx.Status.Should().Be(TransactionStatus.Pending);
        tx.Amount.AmountInCents.Should().Be(5000);
    }

    [Fact]
    public void Transaction_Should_TransitionToPaid_When_Confirmed()
    {
        var tx = new Transaction { Status = TransactionStatus.Pending };
        tx.MarkAsPaid();

        tx.Status.Should().Be(TransactionStatus.Paid);
        tx.PaidAt.Should().NotBeNull();
    }

    [Fact]
    public void Transaction_Should_TransitionToRefunded_When_Refunded()
    {
        var tx = new Transaction { Status = TransactionStatus.Paid };
        tx.MarkAsRefunded();

        tx.Status.Should().Be(TransactionStatus.Refunded);
    }

    [Fact]
    public void Transaction_Should_TransitionToCancelled_When_Cancelled()
    {
        var tx = new Transaction { Status = TransactionStatus.Pending };
        tx.MarkAsCancelled();

        tx.Status.Should().Be(TransactionStatus.Cancelled);
    }

    [Fact]
    public void Transaction_Should_Throw_When_RefundingNonPaidTransaction()
    {
        var tx = new Transaction { Status = TransactionStatus.Pending };

        Action act = () => tx.MarkAsRefunded();

        act.Should().Throw<InvalidOperationException>();
    }
}
