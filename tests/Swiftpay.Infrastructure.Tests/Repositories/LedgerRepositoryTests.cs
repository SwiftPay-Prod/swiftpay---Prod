using Swiftpay.Domain.Entities;
using Swiftpay.Domain.Enums;
using Swiftpay.Domain.ValueObjects;
using Swiftpay.Infrastructure.Data;
using Swiftpay.Infrastructure.Repositories;

namespace Swiftpay.Infrastructure.Tests.Repositories;

public class LedgerRepositoryTests
{
    private AppDbContext CreateContext()
    {
        var o = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new AppDbContext(o);
    }

    [Fact]
    public async Task TransactionExistsAsync_Should_ReturnTrue_When_MatchFound()
    {
        using var ctx = CreateContext();
        var repo = new LedgerRepository(ctx);
        var pid = Guid.NewGuid();
        ctx.LedgerTransactions.Add(new LedgerTransaction { Id = $"tx-{Guid.NewGuid()}", Amount = 1000, Operation = LedgerOperation.PixIn, Status = "Pending", PaymentId = pid });
        await ctx.SaveChangesAsync();
        var exists = await repo.TransactionExistsAsync(pid, LedgerOperation.PixIn, "Pending", CancellationToken.None);
        exists.Should().BeTrue();
    }

    [Fact]
    public async Task GetTransactionByIdAsync_Should_IncludeEntries()
    {
        using var ctx = CreateContext();
        var repo = new LedgerRepository(ctx);
        var txId = $"tx-{Guid.NewGuid()}";
        var acctId = Guid.NewGuid();
        var tx = new LedgerTransaction { Id = txId, Amount = 5000, Operation = LedgerOperation.PixIn, Status = "Pending" };
        tx.Entries.Add(new LedgerEntry { Id = $"e-{Guid.NewGuid()}", AccountId = acctId, Type = LedgerEntryType.Credit, Amount = 5000 });
        ctx.LedgerTransactions.Add(tx);
        await ctx.SaveChangesAsync();

        ctx.ChangeTracker.Clear();
        var found = await repo.GetTransactionByIdAsync(txId, CancellationToken.None);
        found.Should().NotBeNull();
        found!.Entries.Count.Should().Be(1);
    }
}
