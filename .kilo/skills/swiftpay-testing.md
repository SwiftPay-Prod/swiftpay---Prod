# Swiftpay Testing Conventions

## Sub-skills
- **superpowers:test-driven-development** — TDD flow (RED→GREEN→REFACTOR)
- **dotnet:dotnet-test** — Test project scaffolding and execution patterns

## TDD is MANDATORY
Every feature follows RED → GREEN → REFACTOR without exception.

```
RED:   Write a failing test → run → watch it fail
GREEN: Write minimal code to pass → run → watch it pass
REFACTOR: Clean up code → run → verify still passes → commit
```

**NEVER write implementation code before the failing test exists.**

## Test Framework
- **xUnit.net** (not NUnit, not MSTest) — `dotnet new xunit`
- **FluentAssertions** for readable assertions
- **Moq** or **NSubstitute** for mocking

## Naming Convention
```
{MethodName}_Should_{ExpectedBehavior}_When_{Condition}
```
Examples:
- `CreatePaymentLink_Should_ReturnSlug_When_ValidInput()`
- `Withdraw_Should_Fail_When_InsufficientBalance()`
- `Authenticate_Should_ReturnToken_When_ValidCredentials()`

## Test Categories
```csharp
[Fact, Trait("Category", "Unit")]         // Pure logic, no I/O
[Fact, Trait("Category", "Integration")]  // Database, external services
[Fact, Trait("Category", "E2E")]          // Full API flow
```

Run commands:
```bash
dotnet test --filter "Category=Unit"                    # Fast: domain + app tests
dotnet test --filter "Category!=Integration"             # All non-DB tests
dotnet test                                              # Everything
```

## Project Structure
- One test project per source project: `tests/Swiftpay.{Layer}.Tests/`
- Mirror the source namespace structure
- Tests/ folder mirrors src/ folder:

```
tests/
├── Swiftpay.Domain.Tests/
│   └── Entities/
│       └── PaymentLinkTests.cs
├── Swiftpay.Application.Tests/
│   └── Features/
│       └── PaymentLinks/
│           └── CreatePaymentLinkTests.cs
├── Swiftpay.Infrastructure.Tests/
│   └── Repositories/
│       └── PaymentLinkRepositoryTests.cs
└── Swiftpay.WebApi.Tests/
    └── Controllers/
        └── PaymentLinksControllerTests.cs
```

## Domain Tests (Pure Unit - No Mocks)
```csharp
[Fact]
public void CreatePaymentLink_Should_SetAmountInCents_When_ValidInput()
{
    var link = new PaymentLink { Title = "Test", Amount = new Money(3000) };

    link.Amount.AmountInCents.Should().Be(3000);
}
```

## Application Tests (Mock Repositories)
```csharp
[Fact]
public async Task CreatePaymentLink_Should_ReturnId_When_ValidCommand()
{
    var repo = new Mock<IPaymentLinkRepository>();
    var handler = new CreatePaymentLinkHandler(repo.Object);

    var result = await handler.Handle(new CreatePaymentLinkCommand("Test", 3000), CancellationToken.None);

    result.IsSuccess.Should().BeTrue();
    repo.Verify(r => r.AddAsync(It.IsAny<PaymentLink>(), It.IsAny<CancellationToken>()));
}
```

## Infrastructure Tests (EF Core InMemory)
```csharp
[Fact]
public async Task PaymentLinkRepository_Should_SaveAndRetrieve()
{
    var options = new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase("TestDB")
        .Options;

    await using var ctx = new AppDbContext(options);
    var repo = new PaymentLinkRepository(ctx);
    var link = new PaymentLink { Title = "Test", Amount = new Money(3000) };

    await repo.AddAsync(link, CancellationToken.None);
    var result = await repo.GetByIdAsync(link.Id, CancellationToken.None);

    result.Should().NotBeNull();
    result.Title.Should().Be("Test");
}
```

## Test Data Builders (Object Mother)
```csharp
public static class PaymentLinkBuilder
{
    public static PaymentLink CreateDefault() => new()
    {
        Title = "Default Link",
        Amount = new Money(3000),
        Slug = "abcdef12",
        IsActive = true,
    };

    public static PaymentLink WithAmount(this PaymentLink link, long cents)
    {
        link.Amount = new Money(cents);
        return link;
    }
}
```

## Coverage Targets
- Domain: **90%+** (pure logic, easy to test)
- Application: **85%+** (use cases, validation, orchestration)
- Infrastructure: **70%+** (EF Core, external services)
- WebApi: **60%+** (integration flow)

## Test Project Setup
```bash
cd tests
dotnet new xunit -n Swiftpay.Domain.Tests
dotnet new xunit -n Swiftpay.Application.Tests
dotnet new xunit -n Swiftpay.Infrastructure.Tests
dotnet new xunit -n Swiftpay.WebApi.Tests

# Add references
dotnet add tests/Swiftpay.Domain.Tests reference src/Swiftpay.Domain
# Add NuGet test packages
dotnet add tests/Swiftpay.Domain.Tests package FluentAssertions
dotnet add tests/Swiftpay.Application.Tests package Moq
dotnet add tests/Swiftpay.Infrastructure.Tests package Microsoft.EntityFrameworkCore.InMemory

# Add to solution
dotnet sln add tests/Swiftpay.Domain.Tests
```

## CI Integration
- All tests run automatically via `.github/workflows/ci.yml` on push/PR
- Tests must pass before merge (enforced by GitHub Actions, not branch protection on free plan)
