# Swiftpay — PixTransactionService (Payment Orchestrator)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the PixTransactionService orchestrator that ties fee calculation, Payment creation, MagicPay PIX generation, and Ledger pending recording into one flow.

**Architecture:** Service orchestrator in Core layer, called by Payment endpoint. Creates Payment + PaymentPix → calls IPixProvider → saves → publishes RecordLedgerPending.

**Tech Stack:** C# .NET 9, MassTransit, EF Core 9, MagicPay API

---

### Task 1: FeeCalculationService

**Files:**
- Create: `src/Swiftpay.Api.Core/Services/FeeCalculationService.cs`
- Create: `tests/Swiftpay.Application.Tests/Services/FeeCalculationServiceTests.cs`

- [ ] **Step 1: Write FeeCalculationServiceTests (TDD)**

Write `tests/Swiftpay.Application.Tests/Services/FeeCalculationServiceTests.cs`:
```csharp
namespace Swiftpay.Application.Tests.Services;
public class FeeCalculationServiceTests
{
    private readonly FeeCalculationService _calc = new();

    [Fact] public void CalculatePixFees_Should_ComputeAllValues()
    {
        var result = _calc.CalculatePixFees(10000); // R$ 100,00
        result.PlatformFee.Should().Be(500 + 180);   // 5% + R$1,80
        result.AcquirerFee.Should().Be(300 + 100);    // 3% + R$1,00
        result.MerchantSettlementAmount.Should().Be(10000 - 680); // amount - platformFee
        result.NetAmount.Should().Be(10000 - 680 - 400);
        result.AcquirerNetAmount.Should().Be(10000 - 9320 - 400);
    }

    [Fact] public void CalculatePixFees_Should_HandleZero()
    {
        var result = _calc.CalculatePixFees(0);
        result.PlatformFee.Should().Be(0);
        result.MerchantSettlementAmount.Should().Be(0);
    }
}
```

- [ ] **Step 2: Implement FeeCalculationService**

Write `src/Swiftpay.Api.Core/Services/FeeCalculationService.cs`:
```csharp
namespace Swiftpay.Api.Core.Services;
public record FeeCalculationResult(
    long PlatformFee, long AcquirerFee, long NetAmount,
    long MerchantSettlementAmount, long AcquirerNetAmount);
public class FeeCalculationService
{
    private const decimal CashInPercent = 5.00m;
    private const long CashInFixed = 180;     // R$ 1,80
    private const decimal AcquirerPercent = 3.00m;
    private const long AcquirerFixed = 100;   // R$ 1,00

    public FeeCalculationResult CalculatePixFees(long amount)
    {
        if (amount <= 0) return new(0, 0, 0, 0, 0);
        var platformFee = (long)(amount * CashInPercent / 100) + CashInFixed;
        var acquirerFee = (long)(amount * AcquirerPercent / 100) + AcquirerFixed;
        var merchantSettlement = amount - platformFee;
        var netAmount = merchantSettlement - acquirerFee;
        var acquirerNetAmount = amount - netAmount - acquirerFee;
        return new(platformFee, acquirerFee, netAmount, merchantSettlement, acquirerNetAmount);
    }
}
```

- [ ] **Step 3: Run tests**

```bash
dotnet test tests/Swiftpay.Application.Tests --filter "FeeCalculationServiceTests" --configuration Release --verbosity normal 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add src/Swiftpay.Api.Core/Services/FeeCalculationService.cs tests/Swiftpay.Application.Tests/Services/FeeCalculationServiceTests.cs
git commit -m "feat: add FeeCalculationService (5%+R$1,80 cash in, 3%+R$1 acquirer)"
```

---

### Task 2: PixTransactionService (Orchestrator)

**Files:**
- Create: `src/Swiftpay.Api.Core/Services/PixTransactionService.cs`
- Create: `src/Swiftpay.Api.Core/Common/IPaymentRepository.cs`
- Create: `src/Swiftpay.Api.Core/Repositories/PaymentRepository.cs`
- Create: `tests/Swiftpay.Application.Tests/Services/PixTransactionServiceTests.cs`

- [ ] **Step 1: Create IPaymentRepository**

Write `src/Swiftpay.Api.Core/Common/IPaymentRepository.cs`:
```csharp
using Swiftpay.Api.Core.Entities;
namespace Swiftpay.Api.Core.Common;
public interface IPaymentRepository
{
    Task AddAsync(Payment payment, CancellationToken ct);
    Task<Payment?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<Payment?> GetByExternalIdAsync(string externalId, CancellationToken ct);
}
```

- [ ] **Step 2: Create PaymentRepository**

Write `src/Swiftpay.Api.Core/Repositories/PaymentRepository.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Swiftpay.Api.Core.Common;
using Swiftpay.Api.Core.Entities;
using Swiftpay.Infrastructure.Data;
namespace Swiftpay.Api.Core.Repositories;
public class PaymentRepository : IPaymentRepository
{
    private readonly AppDbContext _context;
    public PaymentRepository(AppDbContext context) { _context = context; }
    public async Task AddAsync(Payment payment, CancellationToken ct)
        => await _context.Payments.AddAsync(payment, ct);
    public async Task<Payment?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _context.Payments.Include(p => p.Pix).FirstOrDefaultAsync(p => p.Id == id, ct);
    public async Task<Payment?> GetByExternalIdAsync(string externalId, CancellationToken ct)
        => await _context.Payments.Include(p => p.Pix).FirstOrDefaultAsync(p => p.ExternalId == externalId, ct);
}
```

- [ ] **Step 3: Write PixTransactionServiceTests (TDD)**

Write `tests/Swiftpay.Application.Tests/Services/PixTransactionServiceTests.cs`:
```csharp
using Swiftpay.Api.Core.Providers.MagicPay;
namespace Swiftpay.Application.Tests.Services;
public class PixTransactionServiceTests
{
    private readonly Mock<IPaymentRepository> _repo = new();
    private readonly Mock<IPixProvider> _provider = new();
    private readonly Mock<IPublishEndpoint> _publish = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly FeeCalculationService _calc = new();
    private readonly PixTransactionService _service;
    private readonly Guid _merchantId = Guid.NewGuid();
    public PixTransactionServiceTests()
    {
        _service = new PixTransactionService(_repo.Object, _provider.Object, _publish.Object, _uow.Object, _calc);
    }

    [Fact]
    public async Task CreatePixPaymentAsync_Should_CreatePaymentAndGeneratePix()
    {
        _provider.Setup(p => p.GeneratePixAsync(It.IsAny<PixGenerationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PixGenerationResult(true, "pay_abc", null, "000201010212...", null));

        var result = await _service.CreatePixPaymentAsync(
            _merchantId, 3000, "order_123", "https://webhook.url",
            "John", "12345678901", "john@test.com", "11999999999",
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.CopyAndPaste.Should().Be("000201010212...");
        _repo.Verify(r => r.AddAsync(It.Is<Payment>(p =>
            p.Amount == 3000 && p.MerchantId == _merchantId), It.IsAny<CancellationToken>()));
    }

    [Fact]
    public async Task CreatePixPaymentAsync_Should_ReturnError_When_ProviderFails()
    {
        _provider.Setup(p => p.GeneratePixAsync(It.IsAny<PixGenerationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PixGenerationResult(false, null, null, null, "Provider error"));

        var result = await _service.CreatePixPaymentAsync(
            _merchantId, 3000, "order_456", "https://webhook.url",
            "John", "123", "j@t.com", "111", CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.ErrorMessage.Should().Be("Provider error");
    }
}
```

- [ ] **Step 4: Implement PixTransactionService**

Write `src/Swiftpay.Api.Core/Services/PixTransactionService.cs`:
```csharp
using MassTransit;
using Swiftpay.Api.Core.Common;
using Swiftpay.Api.Core.Entities;
using Swiftpay.Api.Core.Messages;
using Swiftpay.Api.Core.Providers;
namespace Swiftpay.Api.Core.Services;
public class PixTransactionService
{
    private readonly IPaymentRepository _repo;
    private readonly IPixProvider _pixProvider;
    private readonly IPublishEndpoint _publish;
    private readonly IUnitOfWork _uow;
    private readonly FeeCalculationService _calc;

    public PixTransactionService(
        IPaymentRepository repo, IPixProvider pixProvider,
        IPublishEndpoint publish, IUnitOfWork uow,
        FeeCalculationService calc)
    { _repo = repo; _pixProvider = pixProvider; _publish = publish; _uow = uow; _calc = calc; }

    public async Task<PixGenerationResult> CreatePixPaymentAsync(
        Guid merchantId, long amount, string externalRef,
        string notificationUrl, string payerName, string payerTaxId,
        string payerEmail, string payerPhone, CancellationToken ct)
    {
        var fees = _calc.CalculatePixFees(amount);

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            MerchantId = merchantId,
            Amount = amount,
            PlatformFee = fees.PlatformFee,
            AcquirerFee = fees.AcquirerFee,
            NetAmount = fees.NetAmount,
            MerchantSettlementAmount = fees.MerchantSettlementAmount,
            AcquirerNetAmount = fees.AcquirerNetAmount,
            Method = "PIX",
            ExternalId = externalRef,
            NotificationUrl = notificationUrl,
        };

        var pixRequest = new PixGenerationRequest(
            amount, $"Payment {externalRef}", externalRef,
            notificationUrl, payerName, payerTaxId, payerEmail, payerPhone);

        var pixResult = await _pixProvider.GeneratePixAsync(pixRequest, ct);
        if (!pixResult.Success) return pixResult;

        payment.Pix = new PaymentPix
        {
            Id = Guid.NewGuid(),
            PaymentId = payment.Id,
            CopyAndPaste = pixResult.CopyAndPaste,
            QrCodePayload = pixResult.QrCodePayload,
        };
        payment.AcquirerPaymentId = pixResult.TransactionId;

        await _repo.AddAsync(payment, ct);
        await _uow.SaveChangesAsync(ct);

        await _publish.Publish(new PaymentPendingMessage(
            payment.Id, merchantId, null, amount, "production"), ct);

        return pixResult;
    }
}
```

- [ ] **Step 5: Register in DI**

Add to Core's DI registration:
```csharp
services.AddScoped<IPaymentRepository, PaymentRepository>();
services.AddScoped<PixTransactionService>();
services.AddScoped<FeeCalculationService>();
services.AddScoped<IPixProvider>(sp => sp.GetRequiredService<PixProviderFactory>().GetProvider("MagicPay"));
```

- [ ] **Step 6: Build and run tests**

```bash
dotnet build --configuration Release 2>&1 | tail -5
dotnet test tests/Swiftpay.Application.Tests --filter "PixTransactionServiceTests|FeeCalculationServiceTests" --configuration Release --verbosity normal 2>&1 | tail -10
```

- [ ] **Step 7: Commit**

```bash
git add src/Swiftpay.Api.Core/Services/PixTransactionService.cs src/Swiftpay.Api.Core/Common/IPaymentRepository.cs src/Swiftpay.Api.Core/Repositories/PaymentRepository.cs tests/Swiftpay.Application.Tests/Services/PixTransactionServiceTests.cs
git commit -m "feat: implement PixTransactionService orchestrator with fee calculation and provider integration"
```

---

### Task 3: Payment Endpoint (POST /payment-links/{slug}/pay)

**Files:**
- Create: `src/Swiftpay.Api.Payment/Endpoints/PayPaymentLinkEndpoint.cs`
- Create: `tests/Swiftpay.WebApi.Tests/Controllers/PaymentFlowTests.cs`

- [ ] **Step 1: Create the payment endpoint**

Write `src/Swiftpay.Api.Payment/Controllers/PaymentLinksController.cs` — add this method to the existing controller:
```csharp
[HttpPost("{slug}/pay")]
[AllowAnonymous]
public async Task<ActionResult<ApiResponse<object>>> PayBySlug(
    string slug, [FromBody] PayPaymentLinkRequest request, CancellationToken ct)
{
    var link = await _context.PaymentLinks.FirstOrDefaultAsync(p => p.Slug == slug && p.IsActive, ct);
    if (link == null) return NotFound(ApiResponse<object>.Fail("Payment link not found"));
    if (link.IsExpired) return BadRequest(ApiResponse<object>.Fail("Payment link expired"));

    var externalRef = $"{link.Slug}-{Guid.NewGuid():N}"[..20];

    var result = await _pixTransactionService.CreatePixPaymentAsync(
        link.CompanyId, link.Amount.AmountInCents, externalRef,
        $"{Request.Scheme}://{Request.Host}/api/v1/internal/magicpay/webhook",
        request.PayerName ?? "Cliente", request.PayerTaxId ?? "00000000000",
        request.PayerEmail ?? "cliente@email.com", request.PayerPhone ?? "11999999999",
        ct);

    if (!result.IsSuccess)
        return BadRequest(ApiResponse<object>.Fail(result.ErrorMessage!));

    return Ok(ApiResponse<object>.Ok(new {
        paymentId = externalRef,
        qrCode = result.QrCodePayload,
        copyPaste = result.CopyAndPaste,
    }));
}

public record PayPaymentLinkRequest(
    string? PayerName, string? PayerTaxId,
    string? PayerEmail, string? PayerPhone);
```

NOTE: This needs `PixTransactionService` and `AppDbContext` injected into the controller.

- [ ] **Step 2: Create integration test**

Write `tests/Swiftpay.WebApi.Tests/Controllers/PaymentFlowTests.cs`:
```csharp
using System.Net; using System.Net.Http.Json;
namespace Swiftpay.WebApi.Tests.Controllers;
public class PaymentFlowTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    public PaymentFlowTests(CustomWebApplicationFactory factory) { _client = factory.CreateClient(); }

    [Fact]
    public async Task PayPaymentLink_Should_ReturnPixData()
    {
        // Create a payment link first via API
        var login = await _client.PostAsJsonAsync("/api/v1/auth/login",
            new { email = "admin@swiftpay.com", password = "admin123" });

        // Then try to pay it
        var response = await _client.PostAsJsonAsync("/api/v1/payment-links/test-slug/pay",
            new { payerName = "John", payerTaxId = "12345678901" });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
```

- [ ] **Step 3: Build and run all tests**

```bash
dotnet build --configuration Release 2>&1 | tail -3
dotnet test --configuration Release --verbosity normal 2>&1 | tail -10
```

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "feat: add payment endpoint (POST /payment-links/{slug}/pay) and integration test"
git push origin main 2>&1
```
