using Swiftpay.Domain.Enums;
using Swiftpay.Infrastructure.Data;
using Swiftpay.Infrastructure.Repositories;

namespace Swiftpay.Infrastructure.Tests.Repositories;

public class AccountRepositoryTests
{
    private AppDbContext CreateContext()
    {
        var o = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new AppDbContext(o);
    }

    [Fact]
    public async Task GetOrCreateAsync_Should_CreateAccount_When_NotExists()
    {
        using var ctx = CreateContext();
        var repo = new AccountRepository(ctx);
        var merchantId = Guid.NewGuid();
        var a = await repo.GetOrCreateAsync(AccountType.MerchantAvailable, merchantId, null, null, "production", CancellationToken.None);
        a.Should().NotBeNull();
        a.Type.Should().Be(AccountType.MerchantAvailable);
        a.Balance.Should().Be(0);
    }

    [Fact]
    public async Task GetOrCreateAsync_Should_ReturnExisting_When_AlreadyExists()
    {
        using var ctx = CreateContext();
        var repo = new AccountRepository(ctx);
        var mid = Guid.NewGuid();
        var first = await repo.GetOrCreateAsync(AccountType.MerchantPending, mid, null, null, "production", CancellationToken.None);
        var second = await repo.GetOrCreateAsync(AccountType.MerchantPending, mid, null, null, "production", CancellationToken.None);
        first.Id.Should().Be(second.Id);
    }

    [Fact]
    public async Task GetMerchantAccountsAsync_Should_ReturnOnlyMatchedAccounts()
    {
        using var ctx = CreateContext();
        var repo = new AccountRepository(ctx);
        var mid = Guid.NewGuid();
        var otherMid = Guid.NewGuid();
        await repo.GetOrCreateAsync(AccountType.MerchantAvailable, mid, null, null, "production", CancellationToken.None);
        await repo.GetOrCreateAsync(AccountType.MerchantPending, mid, null, null, "production", CancellationToken.None);
        await repo.GetOrCreateAsync(AccountType.MerchantAvailable, otherMid, null, null, "production", CancellationToken.None);
        var accounts = await repo.GetMerchantAccountsAsync(mid, "production", CancellationToken.None);
        accounts.Count.Should().Be(2);
    }
}
