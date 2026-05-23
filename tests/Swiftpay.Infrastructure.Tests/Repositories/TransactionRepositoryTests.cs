using Swiftpay.Domain.Entities;
using Swiftpay.Domain.Enums;
using Swiftpay.Domain.ValueObjects;
using Swiftpay.Infrastructure.Data;
using Swiftpay.Infrastructure.Repositories;

namespace Swiftpay.Infrastructure.Tests.Repositories;

public class TransactionRepositoryTests
{
    private TestAppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TestAppDbContext(options);
    }

    [Fact]
    public async Task AddAsync_Should_PersistTransaction()
    {
        using var ctx = CreateContext();
        var repo = new TransactionRepository(ctx);
        var tx = new Transaction
        {
            Id = Guid.NewGuid(),
            CompanyId = Guid.NewGuid(),
            Amount = new Money(5000),
            Type = TransactionType.Payment,
            Status = TransactionStatus.Paid,
            Method = PaymentMethod.Pix,
        };

        await repo.AddAsync(tx, CancellationToken.None);
        await ctx.SaveChangesAsync();

        var saved = await ctx.Transactions.FindAsync(tx.Id);
        saved.Should().NotBeNull();
        saved!.Amount.AmountInCents.Should().Be(5000);
        saved.Status.Should().Be(TransactionStatus.Paid);
    }

    [Fact]
    public async Task ListByCompanyAsync_Should_ReturnFilteredResults()
    {
        using var ctx = CreateContext();
        var companyId = Guid.NewGuid();

        for (int i = 1; i <= 4; i++)
        {
            ctx.Transactions.Add(new Transaction
            {
                Id = Guid.NewGuid(),
                CompanyId = i <= 3 ? companyId : Guid.NewGuid(),
                Amount = new Money(i * 1000),
                Type = TransactionType.Payment,
                Status = TransactionStatus.Paid,
                Method = PaymentMethod.Pix,
            });
        }
        await ctx.SaveChangesAsync();

        var repo = new TransactionRepository(ctx);
        var list = await repo.ListByCompanyAsync(companyId, 1, 10, CancellationToken.None);
        list.Count.Should().Be(3);

        var count = await repo.CountByCompanyAsync(companyId, CancellationToken.None);
        count.Should().Be(3);
    }
}
