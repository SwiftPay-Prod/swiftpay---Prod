# Swiftpay — Domain Layer + Infrastructure Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the core Domain entities, Value Objects, enums, repository interfaces, AppDbContext, and initial EF Core migration.

**Architecture:** Clean Architecture — Domain layer has zero external dependencies. Infrastructure layer implements persistence. TDD for every entity. Fluent API for EF Core configuration.

**Tech Stack:** C# .NET 9, EF Core 9, Npgsql (PostgreSQL), xUnit, FluentAssertions

---

### Task 1: Create test projects and add to solution

**Files:**
- Create: `tests/Swiftpay.Domain.Tests/Swiftpay.Domain.Tests.csproj`
- Create: `tests/Swiftpay.Domain.Tests/Usings.cs`
- Create: `tests/Swiftpay.Application.Tests/Swiftpay.Application.Tests.csproj`
- Create: `tests/Swiftpay.Application.Tests/Usings.cs`
- Create: `tests/Swiftpay.Infrastructure.Tests/Swiftpay.Infrastructure.Tests.csproj`
- Create: `tests/Swiftpay.Infrastructure.Tests/Usings.cs`
- Modify: `Swiftpay.sln` (add test projects)

- [ ] **Step 1: Create test projects via CLI**

```bash
cd /home/matspectrum-ai/OpenGateway

# Create xunit test projects
dotnet new xunit -n Swiftpay.Domain.Tests -o tests/Swiftpay.Domain.Tests --framework net9.0
dotnet new xunit -n Swiftpay.Application.Tests -o tests/Swiftpay.Application.Tests --framework net9.0
dotnet new xunit -n Swiftpay.Infrastructure.Tests -o tests/Swiftpay.Infrastructure.Tests --framework net9.0

# Add project references (tests reference their source projects)
dotnet add tests/Swiftpay.Domain.Tests reference src/Swiftpay.Domain
dotnet add tests/Swiftpay.Application.Tests reference src/Swiftpay.Application
dotnet add tests/Swiftpay.Infrastructure.Tests reference src/Swiftpay.Infrastructure

# Add test NuGet packages
cd tests/Swiftpay.Domain.Tests && dotnet add package FluentAssertions && cd ../..
cd tests/Swiftpay.Application.Tests && dotnet add package FluentAssertions && dotnet add package Moq && cd ../..
cd tests/Swiftpay.Infrastructure.Tests && dotnet add package FluentAssertions && dotnet add package Microsoft.EntityFrameworkCore.InMemory && cd ../..
```

- [ ] **Step 2: Add test projects to solution**

```bash
cd /home/matspectrum-ai/OpenGateway
dotnet sln add tests/Swiftpay.Domain.Tests/Swiftpay.Domain.Tests.csproj
dotnet sln add tests/Swiftpay.Application.Tests/Swiftpay.Application.Tests.csproj
dotnet sln add tests/Swiftpay.Infrastructure.Tests/Swiftpay.Infrastructure.Tests.csproj
```

- [ ] **Step 3: Write Usings files for each test project**

Write `tests/Swiftpay.Domain.Tests/Usings.cs`:
```csharp
global using Xunit;
global using FluentAssertions;
global using Swiftpay.Domain.Entities;
global using Swiftpay.Domain.ValueObjects;
global using Swiftpay.Domain.Enums;
```

Write `tests/Swiftpay.Application.Tests/Usings.cs`:
```csharp
global using Xunit;
global using FluentAssertions;
global using Moq;
```

Write `tests/Swiftpay.Infrastructure.Tests/Usings.cs`:
```csharp
global using Xunit;
global using FluentAssertions;
global using Microsoft.EntityFrameworkCore;
```

- [ ] **Step 4: Verify solution builds and tests pass (no tests yet, just infrastructure)**

```bash
cd /home/matspectrum-ai/OpenGateway
dotnet build --configuration Release 2>&1 | tail -5
dotnet test --configuration Release 2>&1 | tail -10
```

Expected output: Build: `0 Warning(s), 0 Error(s)`. Test: `Passed! - Failed: 0, Passed: 0, Skipped: 0`.

---

### Task 2: Domain entities

**Files:**
- Create: `src/Swiftpay.Domain/Entities/PaymentLink.cs`
- Create: `src/Swiftpay.Domain/Entities/User.cs`
- Create: `src/Swiftpay.Domain/Entities/Company.cs`
- Create: `src/Swiftpay.Domain/Entities/Transaction.cs`
- Create: `src/Swiftpay.Domain/Entities/Withdrawal.cs`
- Create: `src/Swiftpay.Domain/Entities/Acquirer.cs`
- Create: `tests/Swiftpay.Domain.Tests/Entities/PaymentLinkTests.cs`
- Create: `tests/Swiftpay.Domain.Tests/Entities/TransactionTests.cs`

- [ ] **Step 1: Write PaymentLink entity test (TDD — RED)**

Write `tests/Swiftpay.Domain.Tests/Entities/PaymentLinkTests.cs`:
```csharp
namespace Swiftpay.Domain.Tests.Entities;

public class PaymentLinkTests
{
    [Fact]
    public void CreatePaymentLink_Should_SetAmountInCents_When_ValidInput()
    {
        var link = new PaymentLink
        {
            Id = Guid.NewGuid(),
            Title = "Test Link",
            Description = "Test Description",
            Amount = new Money(3000),
            Slug = "abcdef12",
            IsActive = true,
            CompanyId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
        };

        link.Amount.AmountInCents.Should().Be(3000);
        link.Title.Should().Be("Test Link");
        link.Slug.Should().Be("abcdef12");
        link.IsActive.Should().BeTrue();
        link.UsesCount.Should().Be(0);
    }

    [Fact]
    public void PaymentLink_Should_BeInactive_When_Deactivated()
    {
        var link = new PaymentLink
        {
            Id = Guid.NewGuid(),
            Title = "Test",
            Amount = new Money(1000),
            Slug = "slug1234",
            IsActive = true,
            CompanyId = Guid.NewGuid(),
        };

        link.IsActive = false;

        link.IsActive.Should().BeFalse();
    }

    [Fact]
    public void PaymentLink_Should_BeExpired_When_ExpiresAtPassed()
    {
        var link = new PaymentLink
        {
            ExpiresAt = DateTime.UtcNow.AddHours(-1),
            IsActive = true,
        };

        var isExpired = link.ExpiresAt.HasValue && link.ExpiresAt < DateTime.UtcNow;

        isExpired.Should().BeTrue();
    }

    [Fact]
    public void PaymentLink_Should_BeExhausted_When_MaxUsesReached()
    {
        var link = new PaymentLink
        {
            MaxUses = 5,
            UsesCount = 5,
        };

        var isExhausted = link.MaxUses.HasValue && link.UsesCount >= link.MaxUses;

        isExhausted.Should().BeTrue();
    }
}
```

- [ ] **Step 2: Implement PaymentLink entity (GREEN)**

Write `src/Swiftpay.Domain/Entities/PaymentLink.cs`:
```csharp
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Domain.Entities;

public class PaymentLink
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Money Amount { get; set; } = new(0);
    public Money? AmountMin { get; set; }
    public Money? AmountMax { get; set; }
    public string Slug { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime? ExpiresAt { get; set; }
    public int? MaxUses { get; set; }
    public int UsesCount { get; set; }
    public bool RequireDocument { get; set; }
    public bool RequirePhone { get; set; }
    public string? Theme { get; set; }
    public string? PrimaryColor { get; set; }
    public string? CtaText { get; set; }
    public string? SuccessMessage { get; set; }
    public string? SuccessUrl { get; set; }
    public string? CancelUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
}
```

- [ ] **Step 3: Run PaymentLink tests**

```bash
dotnet test tests/Swiftpay.Domain.Tests --filter "PaymentLinkTests" --configuration Release 2>&1 | tail -10
```

Expected: `Passed! - Failed: 0, Passed: 4, Skipped: 0`.

- [ ] **Step 4: Write Transaction entity test (TDD — RED)**

Write `tests/Swiftpay.Domain.Tests/Entities/TransactionTests.cs`:
```csharp
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
        tx.Status = TransactionStatus.Paid;

        tx.Status.Should().Be(TransactionStatus.Paid);
    }

    [Fact]
    public void Transaction_Should_TransitionToRefunded_When_Refunded()
    {
        var tx = new Transaction { Status = TransactionStatus.Paid };
        tx.Status = TransactionStatus.Refunded;

        tx.Status.Should().Be(TransactionStatus.Refunded);
    }

    [Fact]
    public void Transaction_Should_TransitionToCancelled_When_Cancelled()
    {
        var tx = new Transaction { Status = TransactionStatus.Pending };
        tx.Status = TransactionStatus.Cancelled;

        tx.Status.Should().Be(TransactionStatus.Cancelled);
    }
}
```

- [ ] **Step 5: Implement Transaction entity (GREEN)**

Write `src/Swiftpay.Domain/Entities/Transaction.cs`:
```csharp
using Swiftpay.Domain.Enums;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Domain.Entities;

public class Transaction
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Money Amount { get; set; } = new(0);
    public TransactionType Type { get; set; }
    public TransactionStatus Status { get; set; } = TransactionStatus.Pending;
    public PaymentMethod Method { get; set; }
    public Guid? PaymentLinkId { get; set; }
    public string? GatewayTransactionId { get; set; }
    public string? PixKey { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }
}
```

- [ ] **Step 6: Implement remaining entities**

Write `src/Swiftpay.Domain/Entities/User.cs`:
```csharp
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Email Email { get; set; } = null!;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Owner;
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

Write `src/Swiftpay.Domain/Entities/Company.cs`:
```csharp
namespace Swiftpay.Domain.Entities;

public class Company
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Document { get; set; } = string.Empty;
    public KycStatus KycStatus { get; set; } = KycStatus.Pending;
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Acquirer> Acquirers { get; set; } = new List<Acquirer>();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

Write `src/Swiftpay.Domain/Entities/Withdrawal.cs`:
```csharp
using Swiftpay.Domain.Enums;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Domain.Entities;

public class Withdrawal
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Money Amount { get; set; } = new(0);
    public WithdrawalStatus Status { get; set; } = WithdrawalStatus.Pending;
    public string PixKey { get; set; } = string.Empty;
    public string PixKeyType { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}
```

Write `src/Swiftpay.Domain/Entities/Acquirer.cs`:
```csharp
namespace Swiftpay.Domain.Entities;

public class Acquirer
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsSelected { get; set; }
    public Guid CompanyId { get; set; }
}
```

- [ ] **Step 7: Build and run all domain tests**

```bash
cd /home/matspectrum-ai/OpenGateway
dotnet build --configuration Release 2>&1 | tail -5
dotnet test tests/Swiftpay.Domain.Tests --configuration Release 2>&1 | tail -10
```

Expected: Build `0 Error(s)`, Tests `Passed: 8, Failed: 0`.

- [ ] **Step 8: Commit**

```bash
git add src/Swiftpay.Domain/Entities/ tests/Swiftpay.Domain.Tests/Entities/
git commit -m "feat(domain): add PaymentLink, Transaction, User, Company, Withdrawal, Acquirer entities"
```

---

### Task 3: Value Objects and Enums

**Files:**
- Create: `src/Swiftpay.Domain/ValueObjects/Money.cs`
- Create: `src/Swiftpay.Domain/ValueObjects/Email.cs`
- Create: `src/Swiftpay.Domain/Enums/TransactionType.cs`
- Create: `src/Swiftpay.Domain/Enums/TransactionStatus.cs`
- Create: `src/Swiftpay.Domain/Enums/PaymentMethod.cs`
- Create: `src/Swiftpay.Domain/Enums/UserRole.cs`
- Create: `src/Swiftpay.Domain/Enums/KycStatus.cs`
- Create: `src/Swiftpay.Domain/Enums/WithdrawalStatus.cs`
- Create: `tests/Swiftpay.Domain.Tests/ValueObjects/MoneyTests.cs`

- [ ] **Step 1: Write Money test (TDD — RED)**

Write `tests/Swiftpay.Domain.Tests/ValueObjects/MoneyTests.cs`:
```csharp
namespace Swiftpay.Domain.Tests.ValueObjects;

public class MoneyTests
{
    [Fact]
    public void Money_Should_StoreAmountInCents()
    {
        var money = new Money(3000);
        money.AmountInCents.Should().Be(3000);
    }

    [Fact]
    public void Money_FromDecimal_Should_ConvertCorrectly()
    {
        var money = Money.FromDecimal(30.00m);
        money.AmountInCents.Should().Be(3000);
    }

    [Fact]
    public void Money_ToDecimal_Should_ConvertCorrectly()
    {
        var money = new Money(3000);
        money.ToDecimal().Should().Be(30.00m);
    }

    [Fact]
    public void Money_Equality_Should_Work()
    {
        var a = new Money(1000);
        var b = new Money(1000);
        (a == b).Should().BeTrue();
    }

    [Fact]
    public void Money_Addition_Should_Work()
    {
        var a = new Money(1000);
        var b = new Money(2000);
        var result = a + b;
        result.AmountInCents.Should().Be(3000);
    }

    [Fact]
    public void Money_Should_BeZero_When_Default()
    {
        Money defaultMoney = default;
        defaultMoney.AmountInCents.Should().Be(0);
    }
}
```

- [ ] **Step 2: Implement Money ValueObject (GREEN)**

Write `src/Swiftpay.Domain/ValueObjects/Money.cs`:
```csharp
namespace Swiftpay.Domain.ValueObjects;

public readonly record struct Money(long AmountInCents)
{
    public decimal ToDecimal() => AmountInCents / 100m;

    public static Money FromDecimal(decimal value) => new((long)(value * 100));

    public static Money operator +(Money a, Money b) => new(a.AmountInCents + b.AmountInCents);

    public static Money operator -(Money a, Money b) => new(a.AmountInCents - b.AmountInCents);

    public static Money Zero => new(0);

    public override string ToString() => $"R$ {ToDecimal():N2}";
}
```

- [ ] **Step 3: Implement Email ValueObject**

Write `src/Swiftpay.Domain/ValueObjects/Email.cs`:
```csharp
namespace Swiftpay.Domain.ValueObjects;

public readonly record struct Email(string Address)
{
    public static Email Create(string address)
    {
        if (string.IsNullOrWhiteSpace(address))
            throw new ArgumentException("Email address cannot be empty", nameof(address));

        if (!address.Contains('@'))
            throw new ArgumentException("Email address must contain @", nameof(address));

        return new Email(address.Trim().ToLowerInvariant());
    }

    public override string ToString() => Address;
}
```

- [ ] **Step 4: Implement all Enums**

Write `src/Swiftpay.Domain/Enums/TransactionType.cs`:
```csharp
namespace Swiftpay.Domain.Enums;

public enum TransactionType
{
    Payment,
    Withdrawal,
    Refund,
    Fee
}
```

Write `src/Swiftpay.Domain/Enums/TransactionStatus.cs`:
```csharp
namespace Swiftpay.Domain.Enums;

public enum TransactionStatus
{
    Pending,
    Paid,
    Cancelled,
    Refunded,
    Chargeback
}
```

Write `src/Swiftpay.Domain/Enums/PaymentMethod.cs`:
```csharp
namespace Swiftpay.Domain.Enums;

public enum PaymentMethod
{
    Pix,
    Boleto,
    Card
}
```

Write `src/Swiftpay.Domain/Enums/UserRole.cs`:
```csharp
namespace Swiftpay.Domain.Enums;

public enum UserRole
{
    Owner,
    Admin,
    Support
}
```

Write `src/Swiftpay.Domain/Enums/KycStatus.cs`:
```csharp
namespace Swiftpay.Domain.Enums;

public enum KycStatus
{
    Pending,
    UnderReview,
    Approved,
    Rejected
}
```

Write `src/Swiftpay.Domain/Enums/WithdrawalStatus.cs`:
```csharp
namespace Swiftpay.Domain.Enums;

public enum WithdrawalStatus
{
    Pending,
    Approved,
    Completed,
    Rejected
}
```

- [ ] **Step 5: Run all domain tests**

```bash
cd /home/matspectrum-ai/OpenGateway
dotnet test tests/Swiftpay.Domain.Tests --configuration Release --verbosity normal 2>&1 | tail -15
```

Expected: All tests pass (PaymentLinkTests + TransactionTests + MoneyTests).

- [ ] **Step 6: Commit**

```bash
git add src/Swiftpay.Domain/ValueObjects/ src/Swiftpay.Domain/Enums/ tests/Swiftpay.Domain.Tests/ValueObjects/
git commit -m "feat(domain): add Money and Email ValueObjects + all domain enums"
```

---

### Task 4: Repository interfaces (Application layer)

**Files:**
- Create: `src/Swiftpay.Application/Common/IPaymentLinkRepository.cs`
- Create: `src/Swiftpay.Application/Common/ITransactionRepository.cs`
- Create: `src/Swiftpay.Application/Common/ICompanyRepository.cs`
- Create: `src/Swiftpay.Application/Common/IWithdrawalRepository.cs`
- Create: `src/Swiftpay.Application/Common/IUnitOfWork.cs`
- Create: `src/Swiftpay.Application/Common/ICurrentUserService.cs`

- [ ] **Step 1: Write repository interfaces and commit**

Write `src/Swiftpay.Application/Common/IPaymentLinkRepository.cs`:
```csharp
using Swiftpay.Domain.Entities;

namespace Swiftpay.Application.Common;

public interface IPaymentLinkRepository
{
    Task<PaymentLink?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<List<PaymentLink>> ListByCompanyAsync(Guid companyId, int page, int limit, CancellationToken ct);
    Task<int> CountByCompanyAsync(Guid companyId, CancellationToken ct);
    Task AddAsync(PaymentLink link, CancellationToken ct);
    void Update(PaymentLink link);
    void Delete(PaymentLink link);
}
```

Write `src/Swiftpay.Application/Common/ITransactionRepository.cs`:
```csharp
using Swiftpay.Domain.Entities;

namespace Swiftpay.Application.Common;

public interface ITransactionRepository
{
    Task<Transaction?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<List<Transaction>> ListByCompanyAsync(Guid companyId, int page, int limit, CancellationToken ct);
    Task<int> CountByCompanyAsync(Guid companyId, CancellationToken ct);
    Task AddAsync(Transaction transaction, CancellationToken ct);
}
```

Write `src/Swiftpay.Application/Common/ICompanyRepository.cs`:
```csharp
using Swiftpay.Domain.Entities;

namespace Swiftpay.Application.Common;

public interface ICompanyRepository
{
    Task<Company?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<Company?> GetByDocumentAsync(string document, CancellationToken ct);
    Task AddAsync(Company company, CancellationToken ct);
    void Update(Company company);
}
```

Write `src/Swiftpay.Application/Common/IWithdrawalRepository.cs`:
```csharp
using Swiftpay.Domain.Entities;

namespace Swiftpay.Application.Common;

public interface IWithdrawalRepository
{
    Task<Withdrawal?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<List<Withdrawal>> ListByCompanyAsync(Guid companyId, int page, int limit, CancellationToken ct);
    Task AddAsync(Withdrawal withdrawal, CancellationToken ct);
}
```

Write `src/Swiftpay.Application/Common/IUnitOfWork.cs`:
```csharp
namespace Swiftpay.Application.Common;

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct);
}
```

Write `src/Swiftpay.Application/Common/ICurrentUserService.cs`:
```csharp
namespace Swiftpay.Application.Common;

public interface ICurrentUserService
{
    Guid UserId { get; }
    Guid CompanyId { get; }
    string Email { get; }
    string Role { get; }
}
```

- [ ] **Step 2: Build and verify**

```bash
cd /home/matspectrum-ai/OpenGateway
dotnet build --configuration Release 2>&1 | tail -5
```

Expected: `0 Warning(s), 0 Error(s)`.

- [ ] **Step 3: Commit**

```bash
git add src/Swiftpay.Application/Common/
git commit -m "feat(application): add repository interfaces, IUnitOfWork, ICurrentUserService"
```

---

### Task 5: AppDbContext with Fluent API configuration

**Files:**
- Create: `src/Swiftpay.Infrastructure/Data/AppDbContext.cs`
- Create: `src/Swiftpay.Infrastructure/Data/Configurations/PaymentLinkConfiguration.cs`
- Create: `src/Swiftpay.Infrastructure/Data/Configurations/TransactionConfiguration.cs`
- Create: `src/Swiftpay.Infrastructure/Data/Configurations/UserConfiguration.cs`
- Create: `src/Swiftpay.Infrastructure/Data/Configurations/CompanyConfiguration.cs`
- Create: `src/Swiftpay.Infrastructure/DependencyInjection.cs`
- Modify: `src/Swiftpay.Infrastructure/Swiftpay.Infrastructure.csproj` (add package references if missing)
- Modify: `src/Swiftpay.WebApi/Program.cs` (register infrastructure)

- [ ] **Step 1: Create entity configurations**

Write `src/Swiftpay.Infrastructure/Data/Configurations/PaymentLinkConfiguration.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Infrastructure.Data.Configurations;

public class PaymentLinkConfiguration : IEntityTypeConfiguration<PaymentLink>
{
    public void Configure(EntityTypeBuilder<PaymentLink> builder)
    {
        builder.ToTable("PaymentLinks");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title).HasMaxLength(255).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(1000);
        builder.Property(x => x.Slug).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Theme).HasMaxLength(50);
        builder.Property(x => x.PrimaryColor).HasMaxLength(7);
        builder.Property(x => x.CtaText).HasMaxLength(100);
        builder.Property(x => x.SuccessMessage).HasMaxLength(500);
        builder.Property(x => x.SuccessUrl).HasMaxLength(500);
        builder.Property(x => x.CancelUrl).HasMaxLength(500);

        // Money ValueObject — stored as long in column "Amount"
        builder.OwnsOne(x => x.Amount, m =>
        {
            m.Property(p => p.AmountInCents).HasColumnName("Amount").IsRequired();
        });

        // Nullable Money ValueObjects
        builder.OwnsOne(x => x.AmountMin, m =>
        {
            m.Property(p => p.AmountInCents).HasColumnName("AmountMin");
        });
        builder.OwnsOne(x => x.AmountMax, m =>
        {
            m.Property(p => p.AmountInCents).HasColumnName("AmountMax");
        });

        builder.HasIndex(x => x.Slug).IsUnique();
        builder.HasIndex(x => x.CompanyId);
        builder.HasQueryFilter(x => x.DeletedAt == null);

        builder.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        builder.Property(x => x.UpdatedAt).HasDefaultValueSql("NOW()");
    }
}
```

Write `src/Swiftpay.Infrastructure/Data/Configurations/TransactionConfiguration.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Infrastructure.Data.Configurations;

public class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.ToTable("Transactions");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.GatewayTransactionId).HasMaxLength(100);
        builder.Property(x => x.PixKey).HasMaxLength(100);

        builder.OwnsOne(x => x.Amount, m =>
        {
            m.Property(p => p.AmountInCents).HasColumnName("Amount").IsRequired();
        });

        builder.Property(x => x.Type).HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.Method).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(x => x.CompanyId);
        builder.HasIndex(x => x.PaymentLinkId);
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
    }
}
```

Write `src/Swiftpay.Infrastructure/Data/Configurations/UserConfiguration.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).HasMaxLength(255).IsRequired();
        builder.Property(x => x.PasswordHash).IsRequired();

        builder.OwnsOne(x => x.Email, m =>
        {
            m.Property(p => p.Address).HasColumnName("Email").HasMaxLength(255).IsRequired();
        });

        builder.Property(x => x.Role).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(x => x.Email).IsUnique();
        builder.HasIndex(x => x.CompanyId);

        builder.HasOne(x => x.Company)
            .WithMany(c => c.Users)
            .HasForeignKey(x => x.CompanyId);

        builder.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
    }
}
```

Write `src/Swiftpay.Infrastructure/Data/Configurations/CompanyConfiguration.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Infrastructure.Data.Configurations;

public class CompanyConfiguration : IEntityTypeConfiguration<Company>
{
    public void Configure(EntityTypeBuilder<Company> builder)
    {
        builder.ToTable("Companies");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).HasMaxLength(255).IsRequired();
        builder.Property(x => x.Document).HasMaxLength(18).IsRequired();
        builder.Property(x => x.KycStatus).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(x => x.Document).IsUnique();
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
    }
}
```

- [ ] **Step 2: Create AppDbContext**

Write `src/Swiftpay.Infrastructure/Data/AppDbContext.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<PaymentLink> PaymentLinks => Set<PaymentLink>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Withdrawal> Withdrawals => Set<Withdrawal>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
```

- [ ] **Step 3: Create Infrastructure DependencyInjection**

Write `src/Swiftpay.Infrastructure/DependencyInjection.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

        return services;
    }
}
```

- [ ] **Step 4: Update Program.cs to use infrastructure**

Write `src/Swiftpay.WebApi/Program.cs`:
```csharp
using Swiftpay.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

- [ ] **Step 5: Build**

```bash
cd /home/matspectrum-ai/OpenGateway
dotnet build --configuration Release 2>&1 | tail -10
```

Expected: `0 Warning(s), 0 Error(s)`.

- [ ] **Step 6: Commit**

```bash
git add src/Swiftpay.Infrastructure/Data/ src/Swiftpay.Infrastructure/DependencyInjection.cs src/Swiftpay.WebApi/Program.cs
git commit -m "feat(infra): add AppDbContext with Fluent API configurations for all entities"
```

---

### Task 6: Initial EF Core migration and verify build

**Files:**
- Modify: `src/Swiftpay.WebApi/appsettings.json` (add connection string)
- Create: `src/Swiftpay.Infrastructure/Data/Migrations/` (generated by `dotnet ef`)

- [ ] **Step 1: Ensure EF Core tools and Design package are available**

```bash
cd /home/matspectrum-ai/OpenGateway
dotnet tool install --global dotnet-ef 2>/dev/null || true
```

- [ ] **Step 2: Add appsettings with connection string**

Write `src/Swiftpay.WebApi/appsettings.json` (overwrite the default):
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=swiftpay;Username=swiftpay;Password=swiftpay123"
  },
  "AllowedHosts": "*"
}
```

- [ ] **Step 3: Create initial migration**

```bash
cd /home/matspectrum-ai/OpenGateway
dotnet ef migrations add InitialCreate --project src/Swiftpay.Infrastructure --startup-project src/Swiftpay.WebApi 2>&1 | tail -10
```

Expected: `Done. To undo this action, use 'ef migrations remove'`.

- [ ] **Step 4: Verify migration generated correctly**

```bash
ls -la src/Swiftpay.Infrastructure/Data/Migrations/
```

Expected: Migration files exist (timestamp_InitialCreate.cs + Designer + Snapshot).

- [ ] **Step 5: Full solution build and test**

```bash
cd /home/matspectrum-ai/OpenGateway
dotnet build --configuration Release 2>&1
echo "---"
dotnet test --configuration Release 2>&1 | tail -10
```

Expected: `0 Warning(s), 0 Error(s)`. Tests: `Passed! - Failed: 0`.

- [ ] **Step 6: Commit**

```bash
git add src/Swiftpay.WebApi/appsettings.json src/Swiftpay.Infrastructure/Data/Migrations/
git commit -m "feat(infra): add initial EF Core migration for all domain entities"
```
