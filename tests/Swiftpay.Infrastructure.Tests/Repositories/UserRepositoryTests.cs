using Swiftpay.Domain.Entities;
using Swiftpay.Domain.Enums;
using Swiftpay.Domain.ValueObjects;
using Swiftpay.Infrastructure.Data;
using Swiftpay.Infrastructure.Repositories;

namespace Swiftpay.Infrastructure.Tests.Repositories;

public class UserRepositoryTests
{
    private TestAppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TestAppDbContext(options);
    }

    [Fact]
    public async Task AddAsync_Should_PersistUser()
    {
        using var ctx = CreateContext();
        var repo = new UserRepository(ctx);
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = "Test User",
            Email = Email.Create("test@example.com"),
            PasswordHash = "hash",
            Role = UserRole.Owner,
            CompanyId = Guid.NewGuid(),
        };

        await repo.AddAsync(user, CancellationToken.None);
        await ctx.SaveChangesAsync();

        var saved = await ctx.Users.FindAsync(user.Id);
        saved.Should().NotBeNull();
        saved!.Name.Should().Be("Test User");
        saved.Email.Address.Should().Be("test@example.com");
    }

    [Fact]
    public async Task GetByEmailAsync_Should_ReturnUser()
    {
        using var ctx = CreateContext();
        var company = new Company { Id = Guid.NewGuid(), Name = "Test Co", Document = "123" };
        ctx.Companies.Add(company);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = "Test",
            Email = Email.Create("findme@example.com"),
            PasswordHash = "hash",
            CompanyId = company.Id,
        };
        ctx.Users.Add(user);
        await ctx.SaveChangesAsync();

        var repo = new UserRepository(ctx);
        var found = await repo.GetByEmailAsync("findme@example.com", CancellationToken.None);

        found.Should().NotBeNull();
        found!.Name.Should().Be("Test");
        found.Company.Should().NotBeNull();
        found.Company!.Name.Should().Be("Test Co");
    }

    [Fact]
    public async Task GetByEmailAsync_Should_ReturnNull_When_NotFound()
    {
        using var ctx = CreateContext();
        var repo = new UserRepository(ctx);

        var result = await repo.GetByEmailAsync("nonexistent@test.com", CancellationToken.None);

        result.Should().BeNull();
    }
}
