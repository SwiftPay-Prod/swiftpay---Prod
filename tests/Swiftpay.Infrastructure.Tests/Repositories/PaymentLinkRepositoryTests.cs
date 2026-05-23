using Swiftpay.Domain.Entities;
using Swiftpay.Domain.ValueObjects;
using Swiftpay.Infrastructure.Data;
using Swiftpay.Infrastructure.Repositories;

namespace Swiftpay.Infrastructure.Tests.Repositories;

public class PaymentLinkRepositoryTests
{
    private TestAppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TestAppDbContext(options);
    }

    [Fact]
    public async Task AddAsync_Should_PersistPaymentLink()
    {
        using var ctx = CreateContext();
        var repo = new PaymentLinkRepository(ctx);
        var link = new PaymentLink
        {
            Id = Guid.NewGuid(),
            CompanyId = Guid.NewGuid(),
            Title = "Test Link",
            Amount = new Money(3000),
            Slug = "testslug",
        };

        await repo.AddAsync(link, CancellationToken.None);
        await ctx.SaveChangesAsync();

        var saved = await ctx.PaymentLinks.FindAsync(link.Id);
        saved.Should().NotBeNull();
        saved!.Title.Should().Be("Test Link");
        saved.Amount.AmountInCents.Should().Be(3000);
    }

    [Fact]
    public async Task GetByIdAsync_Should_ReturnNull_When_NotFound()
    {
        using var ctx = CreateContext();
        var repo = new PaymentLinkRepository(ctx);

        var result = await repo.GetByIdAsync(Guid.NewGuid(), CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task ListByCompanyAsync_Should_ReturnPagedResults()
    {
        using var ctx = CreateContext();
        var companyId = Guid.NewGuid();

        for (int i = 1; i <= 5; i++)
        {
            ctx.PaymentLinks.Add(new PaymentLink
            {
                Id = Guid.NewGuid(),
                CompanyId = i <= 3 ? companyId : Guid.NewGuid(),
                Title = $"Link {i}",
                Amount = new Money(i * 1000),
                Slug = $"slug{i}",
            });
        }
        await ctx.SaveChangesAsync();

        var repo = new PaymentLinkRepository(ctx);

        var page1 = await repo.ListByCompanyAsync(companyId, 1, 2, CancellationToken.None);
        page1.Count.Should().Be(2);

        var page2 = await repo.ListByCompanyAsync(companyId, 2, 2, CancellationToken.None);
        page2.Count.Should().Be(1);

        var total = await repo.CountByCompanyAsync(companyId, CancellationToken.None);
        total.Should().Be(3);
    }

    [Fact]
    public async Task Update_Should_ModifyPaymentLink()
    {
        using var ctx = CreateContext();
        var link = new PaymentLink
        {
            Id = Guid.NewGuid(),
            CompanyId = Guid.NewGuid(),
            Title = "Original",
            Amount = new Money(1000),
            Slug = "original",
        };
        ctx.PaymentLinks.Add(link);
        await ctx.SaveChangesAsync();

        link.Title = "Updated";
        link.MarkAsUpdated();
        var repo = new PaymentLinkRepository(ctx);
        repo.Update(link);
        await ctx.SaveChangesAsync();

        var saved = await ctx.PaymentLinks.FindAsync(link.Id);
        saved!.Title.Should().Be("Updated");
    }

    [Fact]
    public async Task Delete_Should_RemovePaymentLink()
    {
        using var ctx = CreateContext();
        var link = new PaymentLink
        {
            Id = Guid.NewGuid(),
            CompanyId = Guid.NewGuid(),
            Title = "To Delete",
            Amount = new Money(1000),
            Slug = "delete",
        };
        ctx.PaymentLinks.Add(link);
        await ctx.SaveChangesAsync();

        var repo = new PaymentLinkRepository(ctx);
        repo.Delete(link);
        await ctx.SaveChangesAsync();

        var saved = await ctx.PaymentLinks.FindAsync(link.Id);
        saved.Should().BeNull();
    }
}
