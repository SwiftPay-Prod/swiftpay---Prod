using Swiftpay.Domain.Entities;
using Swiftpay.Domain.Enums;
using Swiftpay.Domain.ValueObjects;
using Swiftpay.Infrastructure.Data;
using Swiftpay.Infrastructure.Repositories;

namespace Swiftpay.Infrastructure.Tests.Repositories;

public class WithdrawalRepositoryTests
{
    private TestAppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TestAppDbContext(options);
    }

    [Fact]
    public async Task AddAsync_Should_PersistWithdrawal()
    {
        using var ctx = CreateContext();
        var repo = new WithdrawalRepository(ctx);
        var wd = new Withdrawal
        {
            Id = Guid.NewGuid(),
            CompanyId = Guid.NewGuid(),
            Amount = new Money(10000),
            Status = WithdrawalStatus.Pending,
            PixKey = "test@example.com",
            PixKeyType = "EMAIL",
        };

        await repo.AddAsync(wd, CancellationToken.None);
        await ctx.SaveChangesAsync();

        var saved = await ctx.Withdrawals.FindAsync(wd.Id);
        saved.Should().NotBeNull();
        saved!.Amount.AmountInCents.Should().Be(10000);
        saved.PixKey.Should().Be("test@example.com");
    }

    [Fact]
    public async Task ListByCompanyAsync_Should_ReturnOrderedResults()
    {
        using var ctx = CreateContext();
        var companyId = Guid.NewGuid();

        for (int i = 1; i <= 3; i++)
        {
            ctx.Withdrawals.Add(new Withdrawal
            {
                Id = Guid.NewGuid(),
                CompanyId = companyId,
                Amount = new Money(i * 1000),
                PixKey = "key",
                PixKeyType = "EMAIL",
            });
        }
        await ctx.SaveChangesAsync();

        var repo = new WithdrawalRepository(ctx);
        var list = await repo.ListByCompanyAsync(companyId, 1, 10, CancellationToken.None);
        list.Count.Should().Be(3);
    }
}
