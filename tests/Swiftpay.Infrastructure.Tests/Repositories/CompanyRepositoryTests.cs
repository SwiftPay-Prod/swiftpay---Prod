using Swiftpay.Domain.Entities;
using Swiftpay.Domain.Enums;
using Swiftpay.Infrastructure.Data;
using Swiftpay.Infrastructure.Repositories;

namespace Swiftpay.Infrastructure.Tests.Repositories;

public class CompanyRepositoryTests
{
    private TestAppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TestAppDbContext(options);
    }

    [Fact]
    public async Task AddAsync_Should_PersistCompany()
    {
        using var ctx = CreateContext();
        var repo = new CompanyRepository(ctx);
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Minha Empresa Ltda",
            Document = "12345678900123",
            KycStatus = KycStatus.Pending,
        };

        await repo.AddAsync(company, CancellationToken.None);
        await ctx.SaveChangesAsync();

        var saved = await ctx.Companies.FindAsync(company.Id);
        saved.Should().NotBeNull();
        saved!.Name.Should().Be("Minha Empresa Ltda");
        saved.Document.Should().Be("12345678900123");
    }

    [Fact]
    public async Task GetByDocumentAsync_Should_ReturnCompany()
    {
        using var ctx = CreateContext();
        ctx.Companies.Add(new Company
        {
            Id = Guid.NewGuid(),
            Name = "Doc Test",
            Document = "99988877700011",
        });
        await ctx.SaveChangesAsync();

        var repo = new CompanyRepository(ctx);
        var found = await repo.GetByDocumentAsync("99988877700011", CancellationToken.None);

        found.Should().NotBeNull();
        found!.Name.Should().Be("Doc Test");
    }

    [Fact]
    public async Task GetByDocumentAsync_Should_ReturnNull_When_NotFound()
    {
        using var ctx = CreateContext();
        var repo = new CompanyRepository(ctx);

        var result = await repo.GetByDocumentAsync("00000000000000", CancellationToken.None);

        result.Should().BeNull();
    }
}
