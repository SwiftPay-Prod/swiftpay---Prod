# Swiftpay — Ledger System (Double-Entry Accounting)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the double-entry accounting system — Account/LedgerTransaction/LedgerEntry entities, LedgerService with payment/withdrawal lifecycle, and persistent ledger repository with atomic balance updates.

**Architecture:** Domain entities are pure C#. Application layer has LedgerService with idempotent transaction methods. Infrastructure uses raw SQL for atomic balance updates (never EF Core's last-write-wins).

**Tech Stack:** C# .NET 9, MediatR, EF Core 9, Npgsql (raw SQL for balance writes)

---

## File Structure

```
src/
├── Swiftpay.Domain/
│   ├── Entities/
│   │   ├── Account.cs              (Id, Type, MerchantId?, AcquirerId?, Balance, Environment)
│   │   ├── LedgerTransaction.cs    (Id, Operation, Status, PaymentId?, Amount, Entries)
│   │   └── LedgerEntry.cs          (Id, TransactionId, AccountId, Type, Amount)
│   ├── Enums/
│   │   ├── AccountType.cs          (MerchantAvailable, MerchantPending, MerchantBlocked, etc.)
│   │   ├── LedgerOperation.cs      (PixIn, PixOut, PixRefund, PlatformFee, PayOut, etc.)
│   │   └── LedgerEntryType.cs      (Credit, Debit)
│   └── ValueObjects/
│       └── LedgerTransactionResult.cs  (Success/Fail pattern)
│
├── Swiftpay.Application/
│   ├── Common/
│   │   ├── ILedgerRepository.cs    (raw SQL operations)
│   │   ├── IAccountRepository.cs   (get-or-create accounts)
│   │   └── ILedgerService.cs       (high-level ledger operations)
│   └── Services/
│       └── LedgerService.cs        (RecordPaymentPending, RecordPaymentReceived, etc.)
│
└── Swiftpay.Infrastructure/
    ├── Data/
    │   └── Configurations/
    │       ├── AccountConfiguration.cs
    │       ├── LedgerTransactionConfiguration.cs
    │       └── LedgerEntryConfiguration.cs
    ├── Repositories/
    │   ├── LedgerRepository.cs      (raw SQL for balance updates)
    │   └── AccountRepository.cs     (get-or-create pattern)
    └── Migrations/                  (new migration for ledger tables)

tests/
├── Swiftpay.Domain.Tests/
│   └── Entities/
│       └── LedgerEntityTests.cs     (Account, LedgerTransaction, LedgerEntry)
├── Swiftpay.Application.Tests/
│   └── Services/
│       └── LedgerServiceTests.cs    (payment pending, received, refunded, withdrawal)
└── Swiftpay.Infrastructure.Tests/
    └── Repositories/
        ├── AccountRepositoryTests.cs   (get-or-create)
        └── LedgerRepositoryTests.cs    (atomic balance update)
```

---

### Task 1: Domain Entities, Enums, and Tests

**Files:**
- Create: `src/Swiftpay.Domain/Enums/AccountType.cs`
- Create: `src/Swiftpay.Domain/Enums/LedgerOperation.cs`
- Create: `src/Swiftpay.Domain/Enums/LedgerEntryType.cs`
- Create: `src/Swiftpay.Domain/Entities/Account.cs`
- Create: `src/Swiftpay.Domain/Entities/LedgerTransaction.cs`
- Create: `src/Swiftpay.Domain/Entities/LedgerEntry.cs`
- Create: `src/Swiftpay.Domain/ValueObjects/LedgerTransactionResult.cs`
- Create: `tests/Swiftpay.Domain.Tests/Entities/LedgerEntityTests.cs`

- [ ] **Step 1: Write LedgerEntityTests (TDD — RED)**

Write `tests/Swiftpay.Domain.Tests/Entities/LedgerEntityTests.cs`:
```csharp
namespace Swiftpay.Domain.Tests.Entities;

public class LedgerEntityTests
{
    [Fact]
    public void Account_Should_HaveZeroBalance_When_Created()
    {
        var account = new Account
        {
            Id = Guid.NewGuid(),
            Type = AccountType.MerchantAvailable,
            Currency = "BRL",
            Environment = "production",
        };
        account.Balance.Should().Be(0);
    }

    [Fact]
    public void LedgerTransaction_Should_HavePendingStatus_When_Created()
    {
        var tx = new LedgerTransaction
        {
            Id = $"tx-{Guid.NewGuid()}",
            Amount = 3000,
            Operation = LedgerOperation.PixIn,
            Status = "Pending",
        };
        tx.Status.Should().Be("Pending");
    }

    [Fact]
    public void LedgerEntry_Should_BeCredit_When_TypeIsCredit()
    {
        var entry = new LedgerEntry
        {
            Id = $"e-{Guid.NewGuid()}",
            AccountId = Guid.NewGuid(),
            Type = LedgerEntryType.Credit,
            Amount = 1000,
        };
        entry.Type.Should().Be(LedgerEntryType.Credit);
    }

    [Fact]
    public void LedgerTransactionResult_Success_Should_BeSuccess()
    {
        var result = LedgerTransactionResult.Ok("tx-abc", 5000);
        result.IsSuccess.Should().BeTrue();
        result.TransactionId.Should().Be("tx-abc");
        result.NewBalance.Should().Be(5000);
    }

    [Fact]
    public void LedgerTransactionResult_Failure_Should_NotBeSuccess()
    {
        var result = LedgerTransactionResult.Fail("Insufficient balance");
        result.IsSuccess.Should().BeFalse();
        result.ErrorMessage.Should().Be("Insufficient balance");
    }
}
```

- [ ] **Step 2: Run test to confirm failure**

```bash
dotnet test tests/Swiftpay.Domain.Tests --filter "LedgerEntityTests" --configuration Release 2>&1 | tail -5
```

Expected: FAIL — types not defined.

- [ ] **Step 3: Create enum files**

Write `src/Swiftpay.Domain/Enums/AccountType.cs`:
```csharp
namespace Swiftpay.Domain.Enums;

public enum AccountType
{
    MerchantAvailable,
    MerchantPending,
    MerchantBlocked,
    MerchantReserved,
    MerchantPayoutsOut,
    PlatformBlocked,
    PlatformPayoutsOut,
    AcquirerSettlement,
    AcquirerPayoutsOut,
}
```

Write `src/Swiftpay.Domain/Enums/LedgerOperation.cs`:
```csharp
namespace Swiftpay.Domain.Enums;

public enum LedgerOperation
{
    PixIn,
    PixOut,
    PixRefund,
    PixPartialRefund,
    PlatformFee,
    SettlementIn,
    SettlementOut,
    PayOut,
    PlatformPayOutRequested,
    PlatformPayOut,
    Reversal,
    PlatformAdjustment,
    AcquirerAdjustment,
    MerchantAdjustment,
}
```

Write `src/Swiftpay.Domain/Enums/LedgerEntryType.cs`:
```csharp
namespace Swiftpay.Domain.Enums;

public enum LedgerEntryType
{
    Credit,
    Debit,
}
```

- [ ] **Step 4: Create entity files**

Write `src/Swiftpay.Domain/Entities/Account.cs`:
```csharp
using Swiftpay.Domain.Enums;

namespace Swiftpay.Domain.Entities;

public class Account
{
    public Guid Id { get; set; }
    public AccountType Type { get; set; }
    public Guid? MerchantId { get; set; }
    public Guid? AcquirerId { get; set; }
    public Guid? MerchantAcquirerId { get; set; }
    public string Currency { get; set; } = "BRL";
    public long Balance { get; set; }
    public string Environment { get; set; } = "production";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

Write `src/Swiftpay.Domain/Entities/LedgerTransaction.cs`:
```csharp
using Swiftpay.Domain.Enums;

namespace Swiftpay.Domain.Entities;

public class LedgerTransaction
{
    public string Id { get; set; } = string.Empty; // "tx-{Guid}"
    public long Amount { get; set; }
    public LedgerOperation Operation { get; set; }
    public string Status { get; set; } = "Pending"; // Pending | Approved | Refused | Failed | Reversed
    public Guid? PaymentId { get; set; }
    public Guid? PayoutId { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<LedgerEntry> Entries { get; set; } = new List<LedgerEntry>();
}
```

Write `src/Swiftpay.Domain/Entities/LedgerEntry.cs`:
```csharp
using Swiftpay.Domain.Enums;

namespace Swiftpay.Domain.Entities;

public class LedgerEntry
{
    public string Id { get; set; } = string.Empty; // "e-{Guid}"
    public string LedgerTransactionId { get; set; } = string.Empty;
    public Guid AccountId { get; set; }
    public LedgerEntryType Type { get; set; }
    public long Amount { get; set; }
    public string? Description { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public Account Account { get; set; } = null!;
    public LedgerTransaction Transaction { get; set; } = null!;
}
```

Write `src/Swiftpay.Domain/ValueObjects/LedgerTransactionResult.cs`:
```csharp
namespace Swiftpay.Domain.ValueObjects;

public class LedgerTransactionResult
{
    public bool IsSuccess { get; private set; }
    public string? TransactionId { get; private set; }
    public long? NewBalance { get; private set; }
    public string? ErrorMessage { get; private set; }

    public static LedgerTransactionResult Ok(string transactionId, long newBalance) => new()
    {
        IsSuccess = true,
        TransactionId = transactionId,
        NewBalance = newBalance,
    };

    public static LedgerTransactionResult Fail(string errorMessage) => new()
    {
        IsSuccess = false,
        ErrorMessage = errorMessage,
    };
}
```

- [ ] **Step 5: Update Usings.cs for Domain.Tests**

Add to `tests/Swiftpay.Domain.Tests/Usings.cs`:
```csharp
global using Swiftpay.Domain.ValueObjects;
```

- [ ] **Step 6: Run tests**

```bash
dotnet test tests/Swiftpay.Domain.Tests --filter "LedgerEntityTests" --configuration Release --verbosity normal 2>&1 | tail -5
```

Expected: PASS — 5 tests.

- [ ] **Step 7: Commit**

```bash
git add src/Swiftpay.Domain/Enums/AccountType.cs src/Swiftpay.Domain/Enums/LedgerOperation.cs src/Swiftpay.Domain/Enums/LedgerEntryType.cs src/Swiftpay.Domain/Entities/Account.cs src/Swiftpay.Domain/Entities/LedgerTransaction.cs src/Swiftpay.Domain/Entities/LedgerEntry.cs src/Swiftpay.Domain/ValueObjects/LedgerTransactionResult.cs tests/Swiftpay.Domain.Tests/Entities/LedgerEntityTests.cs
git commit -m "feat(domain): add Ledger entities (Account, LedgerTransaction, LedgerEntry) with tests"
```

---

### Task 2: Repository + Service Interfaces

**Files:**
- Create: `src/Swiftpay.Application/Common/ILedgerRepository.cs`
- Create: `src/Swiftpay.Application/Common/IAccountRepository.cs`
- Create: `src/Swiftpay.Application/Common/ILedgerService.cs`

- [ ] **Step 1: Create ILedgerRepository**

Write `src/Swiftpay.Application/Common/ILedgerRepository.cs`:
```csharp
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Application.Common;

public interface ILedgerRepository
{
    Task<LedgerTransactionResult> CreateTransactionWithAtomicBalanceUpdateAsync(
        LedgerTransaction transaction,
        List<(Account account, long delta)> balanceUpdates,
        CancellationToken ct);

    Task<LedgerTransaction?> GetTransactionByIdAsync(string transactionId, CancellationToken ct);

    Task<List<LedgerTransaction>> GetTransactionsByPaymentIdAsync(Guid paymentId, CancellationToken ct);

    Task<bool> TransactionExistsAsync(Guid paymentId, LedgerOperation operation, string status, CancellationToken ct);
}
```

- [ ] **Step 2: Create IAccountRepository**

Write `src/Swiftpay.Application/Common/IAccountRepository.cs`:
```csharp
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.Enums;

namespace Swiftpay.Application.Common;

public interface IAccountRepository
{
    Task<Account> GetOrCreateAsync(
        AccountType type,
        Guid? merchantId,
        Guid? acquirerId,
        Guid? merchantAcquirerId,
        string environment,
        CancellationToken ct);

    Task<List<Account>> GetMerchantAccountsAsync(Guid merchantId, string environment, CancellationToken ct);

    Task<Account?> GetByIdAsync(Guid accountId, CancellationToken ct);
}
```

- [ ] **Step 3: Create ILedgerService**

Write `src/Swiftpay.Application/Common/ILedgerService.cs`:
```csharp
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Application.Common;

public interface ILedgerService
{
    // Payment lifecycle
    Task<LedgerTransactionResult> RecordPaymentPendingAsync(Payment payment, CancellationToken ct);
    Task<LedgerTransactionResult> RecordPaymentReceivedAsync(Payment payment, long settlementAmount, CancellationToken ct);
    Task<LedgerTransactionResult> RecordPaymentCancelledAsync(Payment payment, CancellationToken ct);
    Task<LedgerTransactionResult> RecordPaymentRefundedAsync(Payment payment, long refundAmount, CancellationToken ct);

    // Withdrawal lifecycle
    Task<LedgerTransactionResult> RecordWithdrawalRequestedAsync(Withdrawal withdrawal, CancellationToken ct);
    Task<LedgerTransactionResult> RecordWithdrawalCompletedAsync(Withdrawal withdrawal, long netAmount, CancellationToken ct);
    Task<LedgerTransactionResult> RecordWithdrawalFailedAsync(Withdrawal withdrawal, CancellationToken ct);

    // Balance queries
    Task<long> GetMerchantAvailableBalanceAsync(Guid merchantId, string environment, CancellationToken ct);
    Task<long> GetMerchantPendingBalanceAsync(Guid merchantId, string environment, CancellationToken ct);
}
```

- [ ] **Step 4: Build**

```bash
dotnet build --configuration Release 2>&1 | tail -3
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/Swiftpay.Application/Common/ILedgerRepository.cs src/Swiftpay.Application/Common/IAccountRepository.cs src/Swiftpay.Application/Common/ILedgerService.cs
git commit -m "feat(application): add Ledger repository and service interfaces"
```

---

### Task 3: LedgerService Implementation

**Files:**
- Create: `src/Swiftpay.Application/Services/LedgerService.cs`
- Create: `tests/Swiftpay.Application.Tests/Services/LedgerServiceTests.cs`

- [ ] **Step 1: Write LedgerServiceTests (TDD — RED)**

Write `tests/Swiftpay.Application.Tests/Services/LedgerServiceTests.cs`:
```csharp
using Swiftpay.Application.Common;
using Swiftpay.Application.Services;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.Enums;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Application.Tests.Services;

public class LedgerServiceTests
{
    private readonly Mock<IAccountRepository> _accountRepo;
    private readonly Mock<ILedgerRepository> _ledgerRepo;
    private readonly LedgerService _service;
    private readonly Guid _merchantId = Guid.NewGuid();
    private readonly Guid _acquirerId = Guid.NewGuid();

    public LedgerServiceTests()
    {
        _accountRepo = new Mock<IAccountRepository>();
        _ledgerRepo = new Mock<ILedgerRepository>();
        _service = new LedgerService(_accountRepo.Object, _ledgerRepo.Object);
    }

    private Payment CreateTestPayment(long amountCents, PaymentStatus status = PaymentStatus.Pending)
    {
        return new Payment
        {
            Id = Guid.NewGuid(),
            MerchantId = _merchantId,
            MerchantAcquirerId = Guid.NewGuid(),
            Amount = amountCents,
            Status = status,
            Method = PaymentMethod.Pix,
            Environment = "production",
        };
    }

    [Fact]
    public async Task RecordPaymentPendingAsync_Should_CreditMerchantPending_When_ValidPayment()
    {
        var payment = CreateTestPayment(3000);

        _accountRepo.Setup(r => r.GetOrCreateAsync(
                AccountType.MerchantPending, _merchantId, null, payment.MerchantAcquirerId, "production", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Account { Id = Guid.NewGuid(), Balance = 0 });

        _ledgerRepo.Setup(r => r.TransactionExistsAsync(
                payment.Id, LedgerOperation.PixIn, "Pending", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _ledgerRepo.Setup(r => r.CreateTransactionWithAtomicBalanceUpdateAsync(
                It.IsAny<LedgerTransaction>(), It.IsAny<List<(Account, long)>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(LedgerTransactionResult.Ok("tx-test", 3000));

        var result = await _service.RecordPaymentPendingAsync(payment, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        _ledgerRepo.Verify(r => r.CreateTransactionWithAtomicBalanceUpdateAsync(
            It.Is<LedgerTransaction>(t => t.Operation == LedgerOperation.PixIn && t.Amount == 3000),
            It.IsAny<List<(Account, long)>>(),
            It.IsAny<CancellationToken>()));
    }

    [Fact]
    public async Task RecordPaymentPendingAsync_Should_Skip_When_AlreadyRecorded()
    {
        var payment = CreateTestPayment(3000);

        _ledgerRepo.Setup(r => r.TransactionExistsAsync(
                payment.Id, LedgerOperation.PixIn, "Pending", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await _service.RecordPaymentPendingAsync(payment, CancellationToken.None);

        result.IsSuccess.Should().BeTrue(); // Idempotent — skip, don't fail
    }

    [Fact]
    public async Task RecordPaymentReceivedAsync_Should_TransferPendingToAvailable()
    {
        var payment = CreateTestPayment(10000);
        var pendingId = Guid.NewGuid();
        var availableId = Guid.NewGuid();

        _accountRepo.Setup(r => r.GetOrCreateAsync(AccountType.MerchantPending, _merchantId, null, payment.MerchantAcquirerId, "production", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Account { Id = pendingId, Balance = 10000 });
        _accountRepo.Setup(r => r.GetOrCreateAsync(AccountType.MerchantAvailable, _merchantId, null, payment.MerchantAcquirerId, "production", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Account { Id = availableId, Balance = 0 });
        _accountRepo.Setup(r => r.GetOrCreateAsync(AccountType.AcquirerSettlement, null, It.IsAny<Guid?>(), null, "production", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Account { Id = Guid.NewGuid(), Balance = 0 });

        _ledgerRepo.Setup(r => r.TransactionExistsAsync(payment.Id, LedgerOperation.PixIn, "Approved", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _ledgerRepo.Setup(r => r.CreateTransactionWithAtomicBalanceUpdateAsync(
                It.IsAny<LedgerTransaction>(), It.IsAny<List<(Account, long)>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(LedgerTransactionResult.Ok("tx-rec", 9500));

        var result = await _service.RecordPaymentReceivedAsync(payment, 9500, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task GetMerchantAvailableBalanceAsync_Should_SumAccounts()
    {
        _accountRepo.Setup(r => r.GetMerchantAccountsAsync(_merchantId, "production", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Account>
            {
                new() { Type = AccountType.MerchantAvailable, Balance = 5000 },
                new() { Type = AccountType.MerchantAvailable, Balance = 3000 },
                new() { Type = AccountType.MerchantPending, Balance = 2000 },
            });

        var balance = await _service.GetMerchantAvailableBalanceAsync(_merchantId, "production", CancellationToken.None);

        balance.Should().Be(8000); // Sum of available accounts only
    }
}
```

- [ ] **Step 2: Implement LedgerService**

Write `src/Swiftpay.Application/Services/LedgerService.cs`:
```csharp
using Swiftpay.Application.Common;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.Enums;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Application.Services;

public class LedgerService : ILedgerService
{
    private readonly IAccountRepository _accountRepo;
    private readonly ILedgerRepository _ledgerRepo;

    public LedgerService(IAccountRepository accountRepo, ILedgerRepository ledgerRepo)
    {
        _accountRepo = accountRepo;
        _ledgerRepo = ledgerRepo;
    }

    public async Task<LedgerTransactionResult> RecordPaymentPendingAsync(Payment payment, CancellationToken ct)
    {
        // Idempotency check
        if (await _ledgerRepo.TransactionExistsAsync(payment.Id, LedgerOperation.PixIn, "Pending", ct))
            return LedgerTransactionResult.Ok("already-recorded", 0);

        var pendingAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantPending, payment.MerchantId, null, payment.MerchantAcquirerId,
            payment.Environment, ct);

        var transaction = new LedgerTransaction
        {
            Id = $"tx-{Guid.NewGuid()}",
            Amount = payment.Amount,
            Operation = LedgerOperation.PixIn,
            Status = "Pending",
            PaymentId = payment.Id,
            CreatedAt = DateTime.UtcNow,
        };

        transaction.Entries.Add(new LedgerEntry
        {
            Id = $"e-{Guid.NewGuid()}",
            AccountId = pendingAccount.Id,
            Type = LedgerEntryType.Credit,
            Amount = payment.Amount,
            Timestamp = DateTime.UtcNow,
        });

        return await _ledgerRepo.CreateTransactionWithAtomicBalanceUpdateAsync(
            transaction,
            new List<(Account, long)> { (pendingAccount, payment.Amount) },
            ct);
    }

    public async Task<LedgerTransactionResult> RecordPaymentReceivedAsync(
        Payment payment, long settlementAmount, CancellationToken ct)
    {
        if (await _ledgerRepo.TransactionExistsAsync(payment.Id, LedgerOperation.PixIn, "Approved", ct))
            return LedgerTransactionResult.Ok("already-recorded", 0);

        var pendingAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantPending, payment.MerchantId, null, payment.MerchantAcquirerId,
            payment.Environment, ct);
        var availableAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantAvailable, payment.MerchantId, null, payment.MerchantAcquirerId,
            payment.Environment, ct);
        var settlementAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.AcquirerSettlement, null, payment.MerchantAcquirerId, null,
            payment.Environment, ct);

        var reserveAmount = payment.Amount - settlementAmount;
        long acquirerFee = payment.AcquirerFee;

        var transaction = new LedgerTransaction
        {
            Id = $"tx-{Guid.NewGuid()}",
            Amount = payment.Amount,
            Operation = LedgerOperation.PixIn,
            Status = "Approved",
            PaymentId = payment.Id,
            CreatedAt = DateTime.UtcNow,
        };

        transaction.Entries.Add(new LedgerEntry
        {
            Id = $"e-{Guid.NewGuid()}", AccountId = pendingAccount.Id,
            Type = LedgerEntryType.Debit, Amount = payment.Amount,
            Description = "Release pending", Timestamp = DateTime.UtcNow,
        });
        transaction.Entries.Add(new LedgerEntry
        {
            Id = $"e-{Guid.NewGuid()}", AccountId = availableAccount.Id,
            Type = LedgerEntryType.Credit, Amount = settlementAmount,
            Description = "Settlement", Timestamp = DateTime.UtcNow,
        });
        if (reserveAmount > 0)
        {
            var reservedAccount = await _accountRepo.GetOrCreateAsync(
                AccountType.MerchantReserved, payment.MerchantId, null, payment.MerchantAcquirerId,
                payment.Environment, ct);
            transaction.Entries.Add(new LedgerEntry
            {
                Id = $"e-{Guid.NewGuid()}", AccountId = reservedAccount.Id,
                Type = LedgerEntryType.Credit, Amount = reserveAmount,
                Description = "Reserve", Timestamp = DateTime.UtcNow,
            });
        }
        transaction.Entries.Add(new LedgerEntry
        {
            Id = $"e-{Guid.NewGuid()}", AccountId = settlementAccount.Id,
            Type = LedgerEntryType.Credit, Amount = acquirerFee,
            Description = "Acquirer settlement", Timestamp = DateTime.UtcNow,
        });

        var balanceUpdates = new List<(Account, long)>
        {
            (pendingAccount, -payment.Amount),
            (availableAccount, settlementAmount),
            (settlementAccount, acquirerFee),
        };

        return await _ledgerRepo.CreateTransactionWithAtomicBalanceUpdateAsync(transaction, balanceUpdates, ct);
    }

    public async Task<LedgerTransactionResult> RecordPaymentCancelledAsync(Payment payment, CancellationToken ct)
    {
        if (await _ledgerRepo.TransactionExistsAsync(payment.Id, LedgerOperation.PixIn, "Refused", ct))
            return LedgerTransactionResult.Ok("already-recorded", 0);

        var pendingAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantPending, payment.MerchantId, null, payment.MerchantAcquirerId,
            payment.Environment, ct);

        var transaction = new LedgerTransaction
        {
            Id = $"tx-{Guid.NewGuid()}",
            Amount = payment.Amount,
            Operation = LedgerOperation.PixIn,
            Status = "Refused",
            PaymentId = payment.Id,
            Notes = "Payment cancelled",
            CreatedAt = DateTime.UtcNow,
        };

        transaction.Entries.Add(new LedgerEntry
        {
            Id = $"e-{Guid.NewGuid()}", AccountId = pendingAccount.Id,
            Type = LedgerEntryType.Debit, Amount = payment.Amount,
            Description = "Cancel pending", Timestamp = DateTime.UtcNow,
        });

        return await _ledgerRepo.CreateTransactionWithAtomicBalanceUpdateAsync(
            transaction, new List<(Account, long)> { (pendingAccount, -payment.Amount) }, ct);
    }

    public async Task<LedgerTransactionResult> RecordPaymentRefundedAsync(Payment payment, long refundAmount, CancellationToken ct)
    {
        if (await _ledgerRepo.TransactionExistsAsync(payment.Id, LedgerOperation.PixRefund, "Approved", ct))
            return LedgerTransactionResult.Ok("already-recorded", 0);

        var availableAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantAvailable, payment.MerchantId, null, payment.MerchantAcquirerId,
            payment.Environment, ct);

        var transaction = new LedgerTransaction
        {
            Id = $"tx-{Guid.NewGuid()}",
            Amount = refundAmount,
            Operation = LedgerOperation.PixRefund,
            Status = "Approved",
            PaymentId = payment.Id,
            CreatedAt = DateTime.UtcNow,
        };

        transaction.Entries.Add(new LedgerEntry
        {
            Id = $"e-{Guid.NewGuid()}", AccountId = availableAccount.Id,
            Type = LedgerEntryType.Debit, Amount = refundAmount,
            Description = "Refund", Timestamp = DateTime.UtcNow,
        });

        return await _ledgerRepo.CreateTransactionWithAtomicBalanceUpdateAsync(
            transaction, new List<(Account, long)> { (availableAccount, -refundAmount) }, ct);
    }

    public async Task<LedgerTransactionResult> RecordWithdrawalRequestedAsync(Withdrawal withdrawal, CancellationToken ct)
    {
        var availableAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantAvailable, withdrawal.CompanyId, null, null,
            "production", ct);
        var blockedAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantBlocked, withdrawal.CompanyId, null, null,
            "production", ct);

        var transaction = new LedgerTransaction
        {
            Id = $"tx-{Guid.NewGuid()}",
            Amount = withdrawal.Amount.AmountInCents,
            Operation = LedgerOperation.PayOut,
            Status = "Pending",
            PayoutId = withdrawal.Id,
            CreatedAt = DateTime.UtcNow,
        };

        transaction.Entries.Add(new LedgerEntry
        {
            Id = $"e-{Guid.NewGuid()}", AccountId = availableAccount.Id,
            Type = LedgerEntryType.Debit, Amount = withdrawal.Amount.AmountInCents,
            Description = "Withdrawal request", Timestamp = DateTime.UtcNow,
        });
        transaction.Entries.Add(new LedgerEntry
        {
            Id = $"e-{Guid.NewGuid()}", AccountId = blockedAccount.Id,
            Type = LedgerEntryType.Credit, Amount = withdrawal.Amount.AmountInCents,
            Description = "Withdrawal blocked", Timestamp = DateTime.UtcNow,
        });

        return await _ledgerRepo.CreateTransactionWithAtomicBalanceUpdateAsync(
            transaction,
            new List<(Account, long)> { (availableAccount, -withdrawal.Amount.AmountInCents), (blockedAccount, withdrawal.Amount.AmountInCents) },
            ct);
    }

    public async Task<LedgerTransactionResult> RecordWithdrawalCompletedAsync(Withdrawal withdrawal, long netAmount, CancellationToken ct)
    {
        var blockedAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantBlocked, withdrawal.CompanyId, null, null,
            "production", ct);
        var payoutsAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantPayoutsOut, withdrawal.CompanyId, null, null,
            "production", ct);

        var transaction = new LedgerTransaction
        {
            Id = $"tx-{Guid.NewGuid()}",
            Amount = netAmount,
            Operation = LedgerOperation.SettlementOut,
            Status = "Approved",
            PayoutId = withdrawal.Id,
            CreatedAt = DateTime.UtcNow,
        };

        transaction.Entries.Add(new LedgerEntry
        {
            Id = $"e-{Guid.NewGuid()}", AccountId = blockedAccount.Id,
            Type = LedgerEntryType.Debit, Amount = withdrawal.Amount.AmountInCents,
            Description = "Release blocked", Timestamp = DateTime.UtcNow,
        });
        transaction.Entries.Add(new LedgerEntry
        {
            Id = $"e-{Guid.NewGuid()}", AccountId = payoutsAccount.Id,
            Type = LedgerEntryType.Credit, Amount = netAmount,
            Description = "Completed payout", Timestamp = DateTime.UtcNow,
        });

        return await _ledgerRepo.CreateTransactionWithAtomicBalanceUpdateAsync(
            transaction,
            new List<(Account, long)> { (blockedAccount, -withdrawal.Amount.AmountInCents), (payoutsAccount, netAmount) },
            ct);
    }

    public async Task<LedgerTransactionResult> RecordWithdrawalFailedAsync(Withdrawal withdrawal, CancellationToken ct)
    {
        var blockedAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantBlocked, withdrawal.CompanyId, null, null,
            "production", ct);
        var availableAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantAvailable, withdrawal.CompanyId, null, null,
            "production", ct);

        var transaction = new LedgerTransaction
        {
            Id = $"tx-{Guid.NewGuid()}",
            Amount = withdrawal.Amount.AmountInCents,
            Operation = LedgerOperation.PayOut,
            Status = "Failed",
            PayoutId = withdrawal.Id,
            Notes = "Withdrawal failed — reversed",
            CreatedAt = DateTime.UtcNow,
        };

        transaction.Entries.Add(new LedgerEntry
        {
            Id = $"e-{Guid.NewGuid()}", AccountId = blockedAccount.Id,
            Type = LedgerEntryType.Debit, Amount = withdrawal.Amount.AmountInCents,
            Description = "Release blocked (failure)", Timestamp = DateTime.UtcNow,
        });
        transaction.Entries.Add(new LedgerEntry
        {
            Id = $"e-{Guid.NewGuid()}", AccountId = availableAccount.Id,
            Type = LedgerEntryType.Credit, Amount = withdrawal.Amount.AmountInCents,
            Description = "Restore available (failure)", Timestamp = DateTime.UtcNow,
        });

        return await _ledgerRepo.CreateTransactionWithAtomicBalanceUpdateAsync(
            transaction,
            new List<(Account, long)> { (blockedAccount, -withdrawal.Amount.AmountInCents), (availableAccount, withdrawal.Amount.AmountInCents) },
            ct);
    }

    public async Task<long> GetMerchantAvailableBalanceAsync(Guid merchantId, string environment, CancellationToken ct)
    {
        var accounts = await _accountRepo.GetMerchantAccountsAsync(merchantId, environment, ct);
        return accounts
            .Where(a => a.Type == AccountType.MerchantAvailable)
            .Sum(a => a.Balance);
    }

    public async Task<long> GetMerchantPendingBalanceAsync(Guid merchantId, string environment, CancellationToken ct)
    {
        var accounts = await _accountRepo.GetMerchantAccountsAsync(merchantId, environment, ct);
        return accounts
            .Where(a => a.Type == AccountType.MerchantPending)
            .Sum(a => a.Balance);
    }
}
```

- [ ] **Step 3: Build and run tests**

```bash
dotnet build --configuration Release 2>&1 | tail -3
dotnet test tests/Swiftpay.Application.Tests --filter "LedgerServiceTests" --configuration Release --verbosity normal 2>&1 | tail -10
```

Expected: Build 0 errors. Tests: 4 passed.

- [ ] **Step 4: Commit**

```bash
git add src/Swiftpay.Application/Services/LedgerService.cs tests/Swiftpay.Application.Tests/Services/LedgerServiceTests.cs
git commit -m "feat(application): implement LedgerService with payment and withdrawal lifecycle"
```

---

### Task 4: EF Core Configurations + AccountRepository + LedgerRepository

**Files:**
- Create: `src/Swiftpay.Infrastructure/Data/Configurations/AccountConfiguration.cs`
- Create: `src/Swiftpay.Infrastructure/Data/Configurations/LedgerTransactionConfiguration.cs`
- Create: `src/Swiftpay.Infrastructure/Data/Configurations/LedgerEntryConfiguration.cs`
- Create: `src/Swiftpay.Infrastructure/Repositories/AccountRepository.cs`
- Create: `src/Swiftpay.Infrastructure/Repositories/LedgerRepository.cs`
- Create: `tests/Swiftpay.Infrastructure.Tests/Repositories/LedgerRepositoryTests.cs`
- Create: `tests/Swiftpay.Infrastructure.Tests/Repositories/AccountRepositoryTests.cs`
- Modify: `src/Swiftpay.Infrastructure/Data/AppDbContext.cs` (add ledger DbSets)

- [ ] **Step 1: Create configuration files**

Write `src/Swiftpay.Infrastructure/Data/Configurations/AccountConfiguration.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Infrastructure.Data.Configurations;

public class AccountConfiguration : IEntityTypeConfiguration<Account>
{
    public void Configure(EntityTypeBuilder<Account> builder)
    {
        builder.ToTable("Accounts");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Type).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        builder.Property(x => x.Balance).IsRequired();
        builder.Property(x => x.Environment).HasMaxLength(20).IsRequired();

        builder.HasIndex(x => new { x.MerchantId, x.Type, x.Environment }).IsUnique();
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        builder.Property(x => x.UpdatedAt).HasDefaultValueSql("NOW()");
    }
}
```

Write `src/Swiftpay.Infrastructure/Data/Configurations/LedgerTransactionConfiguration.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Infrastructure.Data.Configurations;

public class LedgerTransactionConfiguration : IEntityTypeConfiguration<LedgerTransaction>
{
    public void Configure(EntityTypeBuilder<LedgerTransaction> builder)
    {
        builder.ToTable("LedgerTransactions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasMaxLength(40);

        builder.Property(x => x.Operation).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Notes).HasMaxLength(500);

        builder.HasIndex(x => x.PaymentId);
        builder.HasIndex(x => x.PayoutId);
        builder.HasIndex(x => new { x.PaymentId, x.Operation, x.Status }).IsUnique();

        builder.HasMany(x => x.Entries)
            .WithOne(e => e.Transaction)
            .HasForeignKey(e => e.LedgerTransactionId);

        builder.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
    }
}
```

Write `src/Swiftpay.Infrastructure/Data/Configurations/LedgerEntryConfiguration.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Infrastructure.Data.Configurations;

public class LedgerEntryConfiguration : IEntityTypeConfiguration<LedgerEntry>
{
    public void Configure(EntityTypeBuilder<LedgerEntry> builder)
    {
        builder.ToTable("LedgerEntries");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasMaxLength(40);

        builder.Property(x => x.Type).HasConversion<string>().HasMaxLength(10).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(255);

        builder.HasIndex(x => x.AccountId);

        builder.Property(x => x.Timestamp).HasDefaultValueSql("NOW()");
    }
}
```

- [ ] **Step 2: Update AppDbContext**

Add to `src/Swiftpay.Infrastructure/Data/AppDbContext.cs`:
```csharp
public DbSet<Account> Accounts => Set<Account>();
public DbSet<LedgerTransaction> LedgerTransactions => Set<LedgerTransaction>();
public DbSet<LedgerEntry> LedgerEntries => Set<LedgerEntry>();
```

- [ ] **Step 3: Create AccountRepository**

Write `src/Swiftpay.Infrastructure/Repositories/AccountRepository.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Swiftpay.Application.Common;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.Enums;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Infrastructure.Repositories;

public class AccountRepository : IAccountRepository
{
    private readonly AppDbContext _context;

    public AccountRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Account> GetOrCreateAsync(
        AccountType type,
        Guid? merchantId,
        Guid? acquirerId,
        Guid? merchantAcquirerId,
        string environment,
        CancellationToken ct)
    {
        var account = await _context.Accounts
            .FirstOrDefaultAsync(a =>
                a.Type == type &&
                a.MerchantId == merchantId &&
                a.Environment == environment &&
                a.MerchantAcquirerId == merchantAcquirerId, ct);

        if (account is not null) return account;

        account = new Account
        {
            Id = Guid.NewGuid(),
            Type = type,
            MerchantId = merchantId,
            AcquirerId = acquirerId,
            MerchantAcquirerId = merchantAcquirerId,
            Environment = environment,
            Balance = 0,
        };

        _context.Accounts.Add(account);
        await _context.SaveChangesAsync(ct);
        return account;
    }

    public async Task<List<Account>> GetMerchantAccountsAsync(Guid merchantId, string environment, CancellationToken ct)
    {
        return await _context.Accounts
            .Where(a => a.MerchantId == merchantId && a.Environment == environment)
            .ToListAsync(ct);
    }

    public async Task<Account?> GetByIdAsync(Guid accountId, CancellationToken ct)
    {
        return await _context.Accounts.FindAsync(new object[] { accountId }, ct);
    }
}
```

- [ ] **Step 4: Create LedgerRepository**

Write `src/Swiftpay.Infrastructure/Repositories/LedgerRepository.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Swiftpay.Application.Common;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.Enums;
using Swiftpay.Domain.ValueObjects;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Infrastructure.Repositories;

public class LedgerRepository : ILedgerRepository
{
    private readonly AppDbContext _context;

    public LedgerRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<LedgerTransactionResult> CreateTransactionWithAtomicBalanceUpdateAsync(
        LedgerTransaction transaction,
        List<(Account account, long delta)> balanceUpdates,
        CancellationToken ct)
    {
        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var dbTransaction = await _context.Database.BeginTransactionAsync(ct);
            try
            {
                // Atomic balance updates via raw SQL
                foreach (var (account, delta) in balanceUpdates)
                {
                    var sql = "UPDATE \"Accounts\" SET \"Balance\" = \"Balance\" + @delta, \"UpdatedAt\" = NOW() WHERE \"Id\" = @id";
                    await _context.Database.ExecuteSqlRawAsync(sql,
                        new Npgsql.NpgsqlParameter("delta", delta),
                        new Npgsql.NpgsqlParameter("id", account.Id));
                }

                // Save transaction + entries
                _context.LedgerTransactions.Add(transaction);
                await _context.SaveChangesAsync(ct);

                await dbTransaction.CommitAsync(ct);

                var updatedAccount = balanceUpdates.Count > 0
                    ? await _context.Accounts.FindAsync(new object[] { balanceUpdates[0].account.Id }, ct)
                    : null;

                return LedgerTransactionResult.Ok(
                    transaction.Id,
                    updatedAccount?.Balance ?? 0);
            }
            catch (Exception ex)
            {
                await dbTransaction.RollbackAsync(ct);
                return LedgerTransactionResult.Fail(ex.Message);
            }
        });
    }

    public async Task<LedgerTransaction?> GetTransactionByIdAsync(string transactionId, CancellationToken ct)
    {
        return await _context.LedgerTransactions
            .Include(t => t.Entries)
            .FirstOrDefaultAsync(t => t.Id == transactionId, ct);
    }

    public async Task<List<LedgerTransaction>> GetTransactionsByPaymentIdAsync(Guid paymentId, CancellationToken ct)
    {
        return await _context.LedgerTransactions
            .Include(t => t.Entries)
            .Where(t => t.PaymentId == paymentId)
            .ToListAsync(ct);
    }

    public async Task<bool> TransactionExistsAsync(Guid paymentId, LedgerOperation operation, string status, CancellationToken ct)
    {
        return await _context.LedgerTransactions
            .AnyAsync(t => t.PaymentId == paymentId && t.Operation == operation && t.Status == status, ct);
    }
}
```

- [ ] **Step 5: Create AccountRepository tests**

Write `tests/Swiftpay.Infrastructure.Tests/Repositories/AccountRepositoryTests.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Swiftpay.Domain.Enums;
using Swiftpay.Infrastructure.Data;
using Swiftpay.Infrastructure.Repositories;

namespace Swiftpay.Infrastructure.Tests.Repositories;

public class AccountRepositoryTests
{
    private AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetOrCreateAsync_Should_CreateAccount_When_NotExists()
    {
        using var ctx = CreateContext();
        var repo = new AccountRepository(ctx);
        var merchantId = Guid.NewGuid();

        var account = await repo.GetOrCreateAsync(
            AccountType.MerchantAvailable, merchantId, null, null, "production", CancellationToken.None);

        account.Should().NotBeNull();
        account.Type.Should().Be(AccountType.MerchantAvailable);
        account.MerchantId.Should().Be(merchantId);
        account.Balance.Should().Be(0);
    }

    [Fact]
    public async Task GetOrCreateAsync_Should_ReturnExisting_When_AlreadyExists()
    {
        using var ctx = CreateContext();
        var repo = new AccountRepository(ctx);
        var merchantId = Guid.NewGuid();

        var first = await repo.GetOrCreateAsync(
            AccountType.MerchantPending, merchantId, null, null, "production", CancellationToken.None);
        var second = await repo.GetOrCreateAsync(
            AccountType.MerchantPending, merchantId, null, null, "production", CancellationToken.None);

        first.Id.Should().Be(second.Id);
    }

    [Fact]
    public async Task GetMerchantAccountsAsync_Should_ReturnOnlyMatchedAccounts()
    {
        using var ctx = CreateContext();
        var repo = new AccountRepository(ctx);
        var merchantId = Guid.NewGuid();
        var otherMerchantId = Guid.NewGuid();

        var m1 = await repo.GetOrCreateAsync(AccountType.MerchantAvailable, merchantId, null, null, "production", CancellationToken.None);
        var m2 = await repo.GetOrCreateAsync(AccountType.MerchantPending, merchantId, null, null, "production", CancellationToken.None);
        await repo.GetOrCreateAsync(AccountType.MerchantAvailable, otherMerchantId, null, null, "production", CancellationToken.None);

        var accounts = await repo.GetMerchantAccountsAsync(merchantId, "production", CancellationToken.None);
        accounts.Count.Should().Be(2);
    }
}
```

- [ ] **Step 6: Create LedgerRepository tests**

Write `tests/Swiftpay.Infrastructure.Tests/Repositories/LedgerRepositoryTests.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
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
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private async Task<Account> CreateAccountAsync(AppDbContext ctx, AccountType type, Guid? merchantId)
    {
        var repo = new AccountRepository(ctx);
        return await repo.GetOrCreateAsync(type, merchantId, null, null, "production", CancellationToken.None);
    }

    [Fact]
    public async Task CreateTransactionWithAtomicBalanceUpdateAsync_Should_UpdateBalances()
    {
        using var ctx = CreateContext();
        var repo = new LedgerRepository(ctx);
        var merchantId = Guid.NewGuid();

        var available = await CreateAccountAsync(ctx, AccountType.MerchantAvailable, merchantId);
        var pending = await CreateAccountAsync(ctx, AccountType.MerchantPending, merchantId);

        var transaction = new LedgerTransaction
        {
            Id = $"tx-{Guid.NewGuid()}",
            Amount = 5000,
            Operation = LedgerOperation.PixIn,
            Status = "Approved",
        };
        transaction.Entries.Add(new LedgerEntry
        {
            Id = $"e-{Guid.NewGuid()}",
            AccountId = pending.Id,
            Type = LedgerEntryType.Debit,
            Amount = 5000,
        });
        transaction.Entries.Add(new LedgerEntry
        {
            Id = $"e-{Guid.NewGuid()}",
            AccountId = available.Id,
            Type = LedgerEntryType.Credit,
            Amount = 4500,
        });

        var result = await repo.CreateTransactionWithAtomicBalanceUpdateAsync(
            transaction,
            new List<(Account, long)>
            {
                (pending, -5000),
                (available, 4500),
            },
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();

        var savedTx = await repo.GetTransactionByIdAsync(transaction.Id, CancellationToken.None);
        savedTx.Should().NotBeNull();
        savedTx!.Entries.Count.Should().Be(2);
    }

    [Fact]
    public async Task TransactionExistsAsync_Should_ReturnTrue_When_MatchFound()
    {
        using var ctx = CreateContext();
        var repo = new LedgerRepository(ctx);
        var paymentId = Guid.NewGuid();

        ctx.LedgerTransactions.Add(new LedgerTransaction
        {
            Id = $"tx-{Guid.NewGuid()}",
            Amount = 1000,
            Operation = LedgerOperation.PixIn,
            Status = "Pending",
            PaymentId = paymentId,
        });
        await ctx.SaveChangesAsync();

        var exists = await repo.TransactionExistsAsync(paymentId, LedgerOperation.PixIn, "Pending", CancellationToken.None);
        exists.Should().BeTrue();
    }
}
```

- [ ] **Step 7: Register repositories in DI**

Update `src/Swiftpay.Infrastructure/DependencyInjection.cs` — add:
```csharp
services.AddScoped<IAccountRepository, AccountRepository>();
services.AddScoped<ILedgerRepository, LedgerRepository>();
services.AddScoped<ILedgerService, LedgerService>();
```

Add the `using` statements:
```csharp
using Swiftpay.Application.Services;
```

- [ ] **Step 8: Build and run all tests**

```bash
cd /home/matspectrum-ai/OpenGateway
dotnet build --configuration Release 2>&1 | tail -5
echo "---"
dotnet test --configuration Release --verbosity normal 2>&1 | tail -10
```

Expected: 0 errors. All tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/Swiftpay.Infrastructure/Data/Configurations/AccountConfiguration.cs src/Swiftpay.Infrastructure/Data/Configurations/LedgerTransactionConfiguration.cs src/Swiftpay.Infrastructure/Data/Configurations/LedgerEntryConfiguration.cs src/Swiftpay.Infrastructure/Repositories/AccountRepository.cs src/Swiftpay.Infrastructure/Repositories/LedgerRepository.cs src/Swiftpay.Infrastructure/Data/AppDbContext.cs src/Swiftpay.Infrastructure/DependencyInjection.cs tests/Swiftpay.Infrastructure.Tests/Repositories/AccountRepositoryTests.cs tests/Swiftpay.Infrastructure.Tests/Repositories/LedgerRepositoryTests.cs
git commit -m "feat(infra): implement AccountRepository and LedgerRepository with raw SQL balance updates"
```

---

### Task 5: Migration + Full Verification + Push

**Files:**
- Modify: `src/Swiftpay.WebApi/Program.cs` (ensure LedgerService is registered)
- Run: EF Core migration

- [ ] **Step 1: Run migration**

```bash
cd /home/matspectrum-ai/OpenGateway
dotnet ef migrations add AddLedgerTables --project src/Swiftpay.Infrastructure --startup-project src/Swiftpay.WebApi 2>&1 | tail -5
```

- [ ] **Step 2: Full build and test**

```bash
dotnet build --configuration Release 2>&1 | tail -3
echo "---"
dotnet test --configuration Release --verbosity normal 2>&1 | tail -10
```

Expected: 0 errors. All tests pass.

- [ ] **Step 3: Commit and push**

```bash
git add -A
git commit -m "feat(infra): add ledger migration with Account/LedgerTransaction/LedgerEntry tables"
git push origin main 2>&1
```

- [ ] **Step 4: Final verification**

```bash
git log --oneline -3
echo ""
echo "=== TOTAL TESTS ==="
dotnet test --configuration Release 2>&1 | grep -E "Passed!|Failed|Total"
```
