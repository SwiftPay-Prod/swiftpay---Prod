using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Domain.Tests.Entities;

public class LedgerEntityTests
{
    [Fact] public void Account_Should_HaveZeroBalance_When_Created()
    {
        var a = new Account { Id = Guid.NewGuid(), Type = AccountType.MerchantAvailable, Currency = "BRL", Environment = "production" };
        a.Balance.Should().Be(0);
    }
    [Fact] public void LedgerTransaction_Should_HavePendingStatus_When_Created()
    {
        var tx = new LedgerTransaction { Id = $"tx-{Guid.NewGuid()}", Amount = 3000, Operation = LedgerOperation.PixIn, Status = "Pending" };
        tx.Status.Should().Be("Pending");
    }
    [Fact] public void LedgerEntry_Should_BeCredit_When_TypeIsCredit()
    {
        var e = new LedgerEntry { Id = $"e-{Guid.NewGuid()}", AccountId = Guid.NewGuid(), Type = LedgerEntryType.Credit, Amount = 1000 };
        e.Type.Should().Be(LedgerEntryType.Credit);
    }
    [Fact] public void LedgerTransactionResult_Success_Should_BeSuccess()
    {
        var r = LedgerTransactionResult.Ok("tx-abc", 5000);
        r.IsSuccess.Should().BeTrue(); r.TransactionId.Should().Be("tx-abc"); r.NewBalance.Should().Be(5000);
    }
    [Fact] public void LedgerTransactionResult_Failure_Should_NotBeSuccess()
    {
        var r = LedgerTransactionResult.Fail("Insufficient balance");
        r.IsSuccess.Should().BeFalse(); r.ErrorMessage.Should().Be("Insufficient balance");
    }
}
