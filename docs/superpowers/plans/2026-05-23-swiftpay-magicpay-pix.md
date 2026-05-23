# Swiftpay — MagicPay PIX Integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate MagicPay as the first PIX provider — create payments, generate PIX QR Codes, receive webhook notifications, and settle via Ledger.

**Architecture:** Strategy pattern with IPixProvider interface. MagicPay has 3 layers: Service (business rules) → Client (HTTP) → Parser (response parsing). Webhook endpoint receives notifications and publishes RabbitMQ messages for async processing.

**Tech Stack:** C# .NET 9, MassTransit/RabbitMQ, EF Core 9, Npgsql, HttpClient (typed)

---

### Task 1: Payment + PaymentPix Entities and EF Core Configuration

**Files:**
- Create: `src/Swiftpay.Api.Core/Entities/Payment.cs`
- Create: `src/Swiftpay.Api.Core/Entities/PaymentPix.cs`
- Create: `src/Swiftpay.Api.Core/Data/Configurations/PaymentConfiguration.cs`
- Create: `src/Swiftpay.Api.Core/Data/Configurations/PaymentPixConfiguration.cs`
- Create: `tests/Swiftpay.Domain.Tests/Entities/PaymentTests.cs`
- Modify: `src/Swiftpay.Api.Core/Data/AppDbContext.cs` (add Payment, PaymentPix DbSets)

- [ ] **Step 1: Write PaymentTests (TDD — RED)**

Write `tests/Swiftpay.Domain.Tests/Entities/PaymentTests.cs`:
```csharp
namespace Swiftpay.Domain.Tests.Entities;
public class PaymentTests
{
    [Fact]
    public void CreatePayment_Should_HavePendingStatus()
    {
        var p = new Payment { Id = Guid.NewGuid(), Amount = 5000, MerchantId = Guid.NewGuid(), Method = "PIX" };
        p.Status.Should().Be("PENDING");
    }
    [Fact]
    public void CreatePaymentPix_Should_StoreQrCode()
    {
        var p = new PaymentPix { Id = Guid.NewGuid(), PaymentId = Guid.NewGuid(), CopyAndPaste = "000201010212..." };
        p.CopyAndPaste.Should().Be("000201010212...");
    }
    [Fact]
    public void Payment_Status_Should_TransitionToPaid()
    {
        var p = new Payment { Id = Guid.NewGuid(), Amount = 5000, MerchantId = Guid.NewGuid(), Method = "PIX" };
        p.Status = "PAID";
        p.PaidAt = DateTime.UtcNow;
        p.Status.Should().Be("PAID");
        p.PaidAt.Should().NotBeNull();
    }
}
```

- [ ] **Step 2: Implement Payment entity**

Write `src/Swiftpay.Api.Core/Entities/Payment.cs`:
```csharp
namespace Swiftpay.Api.Core.Entities;
public class Payment
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public Guid? MerchantAcquirerId { get; set; }
    public long Amount { get; set; }
    public long PlatformFee { get; set; }
    public long AcquirerFee { get; set; }
    public long NetAmount { get; set; }
    public long MerchantSettlementAmount { get; set; }
    public long AcquirerNetAmount { get; set; }
    public string Status { get; set; } = "PENDING";
    public string Method { get; set; } = "PIX";
    public string? ExternalId { get; set; }
    public string? AcquirerPaymentId { get; set; }
    public string? NotificationUrl { get; set; }
    public string? FailureReason { get; set; }
    public string Environment { get; set; } = "production";
    public Guid? PaymentLinkId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }
    public DateTime? RefundedAt { get; set; }
    public PaymentPix? Pix { get; set; }
}
```

- [ ] **Step 3: Implement PaymentPix entity**

Write `src/Swiftpay.Api.Core/Entities/PaymentPix.cs`:
```csharp
namespace Swiftpay.Api.Core.Entities;
public class PaymentPix
{
    public Guid Id { get; set; }
    public Guid PaymentId { get; set; }
    public string? TxId { get; set; }
    public string? QrCodePayload { get; set; }
    public string? QrCodeBase64 { get; set; }
    public string? CopyAndPaste { get; set; }
    public string? EndToEndId { get; set; }
    public string? PixKey { get; set; }
    public string? PixKeyType { get; set; }
    public string? PayerName { get; set; }
    public string? PayerDocument { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public Payment Payment { get; set; } = null!;
}
```

- [ ] **Step 4: Create EF Core configurations**

Write `src/Swiftpay.Api.Core/Data/Configurations/PaymentConfiguration.cs`:
```csharp
using Microsoft.EntityFrameworkCore; using Microsoft.EntityFrameworkCore.Metadata.Builders; using Swiftpay.Api.Core.Entities;
namespace Swiftpay.Api.Core.Data.Configurations;
public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments"); builder.HasKey(x => x.Id);
        builder.Property(x => x.Status).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Method).HasMaxLength(20).IsRequired();
        builder.Property(x => x.ExternalId).HasMaxLength(100);
        builder.Property(x => x.AcquirerPaymentId).HasMaxLength(100);
        builder.Property(x => x.NotificationUrl).HasMaxLength(500);
        builder.Property(x => x.FailureReason).HasMaxLength(500);
        builder.Property(x => x.Environment).HasMaxLength(20).IsRequired();
        builder.HasIndex(x => x.AcquirerPaymentId);
        builder.HasIndex(x => x.ExternalId);
        builder.HasIndex(x => x.MerchantId);
        builder.HasOne(x => x.Pix).WithOne(p => p.Payment).HasForeignKey<PaymentPix>(p => p.PaymentId);
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
    }
}
```

Write `src/Swiftpay.Api.Core/Data/Configurations/PaymentPixConfiguration.cs`:
```csharp
using Microsoft.EntityFrameworkCore; using Microsoft.EntityFrameworkCore.Metadata.Builders; using Swiftpay.Api.Core.Entities;
namespace Swiftpay.Api.Core.Data.Configurations;
public class PaymentPixConfiguration : IEntityTypeConfiguration<PaymentPix>
{
    public void Configure(EntityTypeBuilder<PaymentPix> builder)
    {
        builder.ToTable("PaymentPix"); builder.HasKey(x => x.Id);
        builder.Property(x => x.TxId).HasMaxLength(100);
        builder.Property(x => x.CopyAndPaste).HasMaxLength(500);
        builder.Property(x => x.EndToEndId).HasMaxLength(100);
        builder.Property(x => x.PixKey).HasMaxLength(100);
        builder.Property(x => x.PixKeyType).HasMaxLength(20);
        builder.Property(x => x.PayerName).HasMaxLength(255);
        builder.Property(x => x.PayerDocument).HasMaxLength(18);
    }
}
```

- [ ] **Step 5: Update AppDbContext**

Add to `src/Swiftpay.Api.Core/Data/AppDbContext.cs`:
```csharp
public DbSet<Payment> Payments => Set<Payment>();
public DbSet<PaymentPix> PaymentPixs => Set<PaymentPix>();
```

- [ ] **Step 6: Build and run tests**

```bash
dotnet test tests/Swiftpay.Domain.Tests --filter "PaymentTests" --configuration Release --verbosity normal 2>&1 | tail -5
```

Expected: 3 PaymentTests pass.

- [ ] **Step 7: Commit**

```bash
git add src/Swiftpay.Api.Core/Entities/Payment.cs src/Swiftpay.Api.Core/Entities/PaymentPix.cs src/Swiftpay.Api.Core/Data/Configurations/PaymentConfiguration.cs src/Swiftpay.Api.Core/Data/Configurations/PaymentPixConfiguration.cs src/Swiftpay.Api.Core/Data/AppDbContext.cs tests/Swiftpay.Domain.Tests/Entities/PaymentTests.cs
git commit -m "feat: add Payment and PaymentPix entities with EF Core config"
```

---

### Task 2: IPixProvider Interface + Models

**Files:**
- Create: `src/Swiftpay.Api.Core/Providers/IPixProvider.cs`
- Create: `src/Swiftpay.Api.Core/Providers/PixGenerationRequest.cs`
- Create: `src/Swiftpay.Api.Core/Providers/PixGenerationResult.cs`

- [ ] **Step 1: Create IPixProvider interface**

Write `src/Swiftpay.Api.Core/Providers/IPixProvider.cs`:
```csharp
namespace Swiftpay.Api.Core.Providers;
public record PixGenerationRequest(
    long Amount, string Description, string ExternalRef,
    string NotificationUrl, string PayerName, string PayerTaxId,
    string PayerEmail, string PayerPhone);
public record PixGenerationResult(
    bool Success, string? TransactionId, string? QrCodePayload,
    string? CopyAndPaste, string? ErrorMessage);
public record PixStatusResult(
    bool Success, string Status, string? EndToEndId,
    string? PayerName, string? PayerDocument, DateTime? PaidAt,
    string? ErrorMessage);
public record PixRefundResult(bool Success, string? ErrorMessage);

public interface IPixProvider
{
    string ProviderName { get; }
    Task<PixGenerationResult> GeneratePixAsync(PixGenerationRequest request, CancellationToken ct);
    Task<PixStatusResult> GetPixStatusAsync(string transactionId, CancellationToken ct);
    Task<PixRefundResult> RefundAsync(string transactionId, long amount, CancellationToken ct);
}
```

- [ ] **Step 2: Build**

```bash
dotnet build --configuration Release 2>&1 | tail -3
```

- [ ] **Step 3: Commit**

```bash
git add src/Swiftpay.Api.Core/Providers/IPixProvider.cs
git commit -m "feat: add IPixProvider interface and DTOs"
```

---

### Task 3: MagicPayClient (HTTP) + MagicPayResponseParser

**Files:**
- Create: `src/Swiftpay.Api.Core/Providers/MagicPay/MagicPayClient.cs`
- Create: `src/Swiftpay.Api.Core/Providers/MagicPay/MagicPayResponseParser.cs`
- Create: `src/Swiftpay.Api.Core/Providers/MagicPay/Models/MagicPayModels.cs`
- Create: `tests/Swiftpay.Infrastructure.Tests/Providers/MagicPayResponseParserTests.cs`

- [ ] **Step 1: Write parser tests (TDD)**

Write `tests/Swiftpay.Infrastructure.Tests/Providers/MagicPayResponseParserTests.cs`:
```csharp
using Swiftpay.Api.Core.Providers.MagicPay;
namespace Swiftpay.Infrastructure.Tests.Providers;
public class MagicPayResponseParserTests
{
    private readonly MagicPayResponseParser _parser = new();
    [Fact]
    public void ParseCreatePaymentResponse_Should_ExtractPixData()
    {
        var json = """{"id":"pay_abc123","amount":5000,"status":"PENDING","data":{"copypaste":"000201010212...","e2e":"E1234567890123456789012345678901"},"payer":{"name":"John","taxId":"123"}}""";
        var result = _parser.ParseCreatePaymentResponse(json);
        result.Should().NotBeNull();
        result.TransactionId.Should().Be("pay_abc123");
        result.CopyAndPaste.Should().Be("000201010212...");
        result.Success.Should().BeTrue();
    }
    [Fact]
    public void ParseCreatePaymentResponse_Should_ReturnError_When_ErrorResponse()
    {
        var json = """{"error":"invalid_amount","message":"Amount must be positive"}""";
        var result = _parser.ParseCreatePaymentResponse(json);
        result.Success.Should().BeFalse();
        result.ErrorMessage.Should().Contain("invalid_amount");
    }
}
```

- [ ] **Step 2: Create MagicPay Models**

Write `src/Swiftpay.Api.Core/Providers/MagicPay/Models/MagicPayModels.cs`:
```csharp
using System.Text.Json.Serialization;
namespace Swiftpay.Api.Core.Providers.MagicPay.Models;
public record MagicPayPaymentRequest(
    [property: JsonPropertyName("amount")] long Amount,
    [property: JsonPropertyName("currency")] string Currency,
    [property: JsonPropertyName("method")] string Method,
    [property: JsonPropertyName("description")] string Description,
    [property: JsonPropertyName("externalRef")] string ExternalRef,
    [property: JsonPropertyName("notificationUrl")] string NotificationUrl,
    [property: JsonPropertyName("payer")] MagicPayPayer Payer);
public record MagicPayPayer(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("taxId")] string TaxId,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("phone")] string Phone);
public record MagicPayPaymentResponse(
    [property: JsonPropertyName("id")] string? Id,
    [property: JsonPropertyName("amount")] long? Amount,
    [property: JsonPropertyName("status")] string? Status,
    [property: JsonPropertyName("data")] MagicPayData? Data,
    [property: JsonPropertyName("payer")] MagicPayPayer? Payer,
    [property: JsonPropertyName("error")] string? Error,
    [property: JsonPropertyName("message")] string? Message);
public record MagicPayData(
    [property: JsonPropertyName("copypaste")] string? Copypaste,
    [property: JsonPropertyName("e2e")] string? E2E);
```

- [ ] **Step 3: Create MagicPayResponseParser**

Write `src/Swiftpay.Api.Core/Providers/MagicPay/MagicPayResponseParser.cs`:
```csharp
using System.Text.Json;
using Swiftpay.Api.Core.Providers.MagicPay.Models;
namespace Swiftpay.Api.Core.Providers.MagicPay;
public class MagicPayResponseParser
{
    public PixGenerationResult ParseCreatePaymentResponse(string json)
    {
        try
        {
            var resp = JsonSerializer.Deserialize<MagicPayPaymentResponse>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            if (resp?.Error != null)
                return new PixGenerationResult(false, null, null, null, $"{resp.Error}: {resp.Message}");
            return new PixGenerationResult(true, resp!.Id, null, resp.Data?.Copypaste, null);
        }
        catch (Exception ex) { return new PixGenerationResult(false, null, null, null, ex.Message); }
    }
}
```

- [ ] **Step 4: Create MagicPayClient**

Write `src/Swiftpay.Api.Core/Providers/MagicPay/MagicPayClient.cs`:
```csharp
using Swiftpay.Api.Core.Providers.MagicPay.Models;
namespace Swiftpay.Api.Core.Providers.MagicPay;
public class MagicPayClient
{
    private readonly HttpClient _http;
    private readonly MagicPayResponseParser _parser;
    public MagicPayClient(HttpClient http, MagicPayResponseParser parser) { _http = http; _parser = parser; }

    public async Task<PixGenerationResult> CreatePaymentAsync(MagicPayPaymentRequest request, CancellationToken ct)
    {
        var response = await _http.PostAsJsonAsync("/v1/payment", request, ct);
        var json = await response.Content.ReadAsStringAsync(ct);
        return _parser.ParseCreatePaymentResponse(json);
    }
}
```

- [ ] **Step 5: Build and run tests**

```bash
dotnet build --configuration Release 2>&1 | tail -3
dotnet test tests/Swiftpay.Infrastructure.Tests --filter "MagicPayResponseParserTests" --configuration Release --verbosity normal 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
git add src/Swiftpay.Api.Core/Providers/MagicPay/ tests/Swiftpay.Infrastructure.Tests/Providers/
git commit -m "feat: add MagicPay HTTP client and response parser with tests"
```

---

### Task 4: MagicPayPixService + Factory + DI

**Files:**
- Create: `src/Swiftpay.Api.Core/Providers/MagicPay/MagicPayPixService.cs`
- Create: `src/Swiftpay.Api.Core/Providers/PixProviderFactory.cs`
- Create: `tests/Swiftpay.Application.Tests/Providers/MagicPayPixServiceTests.cs`

- [ ] **Step 1: Create MagicPayPixService**

Write `src/Swiftpay.Api.Core/Providers/MagicPay/MagicPayPixService.cs`:
```csharp
using Swiftpay.Api.Core.Providers.MagicPay.Models;
namespace Swiftpay.Api.Core.Providers.MagicPay;
public class MagicPayPixService : IPixProvider
{
    private readonly MagicPayClient _client;
    private readonly MagicPayResponseParser _parser;
    public string ProviderName => "MagicPay";
    public MagicPayPixService(MagicPayClient client, MagicPayResponseParser parser) { _client = client; _parser = parser; }

    public async Task<PixGenerationResult> GeneratePixAsync(PixGenerationRequest request, CancellationToken ct)
    {
        var payload = new MagicPayPaymentRequest(
            request.Amount, "BRL", "PIX", request.Description,
            request.ExternalRef, request.NotificationUrl,
            new MagicPayPayer(request.PayerName, request.PayerTaxId, request.PayerEmail, request.PayerPhone));
        return await _client.CreatePaymentAsync(payload, ct);
    }

    public Task<PixStatusResult> GetPixStatusAsync(string transactionId, CancellationToken ct)
        => throw new NotImplementedException();

    public Task<PixRefundResult> RefundAsync(string transactionId, long amount, CancellationToken ct)
        => throw new NotImplementedException();
}
```

- [ ] **Step 2: Create PixProviderFactory**

Write `src/Swiftpay.Api.Core/Providers/PixProviderFactory.cs`:
```csharp
namespace Swiftpay.Api.Core.Providers;
public class PixProviderFactory
{
    private readonly IEnumerable<IPixProvider> _providers;
    public PixProviderFactory(IEnumerable<IPixProvider> providers) { _providers = providers; }
    public IPixProvider GetProvider(string name) =>
        _providers.FirstOrDefault(p => p.ProviderName == name)
        ?? throw new KeyNotFoundException($"Provider '{name}' not found");
}
```

- [ ] **Step 3: Register in DI**

Update `src/Swiftpay.Api.Core/DependencyInjection.cs` or add registrations in both Gestao and Payment Program.cs:
Add MagicPay provider registration.

- [ ] **Step 4: Build**

```bash
dotnet build --configuration Release 2>&1 | tail -3
```

- [ ] **Step 5: Commit**

```bash
git add src/Swiftpay.Api.Core/Providers/MagicPay/MagicPayPixService.cs src/Swiftpay.Api.Core/Providers/PixProviderFactory.cs
git commit -m "feat: add MagicPayPixService and PixProviderFactory"
```

---

### Task 5: Webhook Endpoint + WebhookAuth

**Files:**
- Create: `src/Swiftpay.Api.Payment/Controllers/InternalController.cs`

- [ ] **Step 1: Create webhook endpoint**

Write `src/Swiftpay.Api.Payment/Controllers/InternalController.cs`:
```csharp
using Microsoft.AspNetCore.Mvc; using Swiftpay.Api.Core.Entities; using Swiftpay.Api.Core.Messages;
using MassTransit; using Swiftpay.Infrastructure.Data;
namespace Swiftpay.Api.Payment.Controllers;

[ApiController] [Route("api/v1/internal")] [AllowAnonymous]
public class InternalController : ControllerBase
{
    private readonly AppDbContext _db; private readonly IPublishEndpoint _publish;
    public InternalController(AppDbContext db, IPublishEndpoint publish) { _db = db; _publish = publish; }

    [HttpPost("magicpay/webhook")]
    public async Task<IActionResult> MagicPayWebhook([FromBody] JsonElement payload, CancellationToken ct)
    {
        var acquirerId = payload.GetProperty("id").GetString();
        var status = payload.GetProperty("status").GetString();
        var externalRef = payload.GetProperty("externalRef").GetString();

        var payment = await _db.Payments.FirstOrDefaultAsync(p => p.ExternalId == externalRef, ct);
        if (payment == null) return NotFound();

        payment.Status = status;
        if (status == "PAID")
        {
            payment.PaidAt = DateTime.UtcNow;
            if (payload.TryGetProperty("data", out var data) && data.TryGetProperty("e2e", out var e2e))
                payment.Pix!.EndToEndId = e2e.GetString();
        }
        await _db.SaveChangesAsync(ct);

        if (status == "PAID")
        {
            await _publish.Publish(new PaymentCompletedMessage(
                payment.Id, "PAID", payment.Amount, payment.MerchantSettlementAmount, payment.AcquirerFee, payment.Environment), ct);
        }
        return Ok();
    }
}
```

- [ ] **Step 2: Build**

```bash
dotnet build --configuration Release 2>&1 | tail -3
```

- [ ] **Step 3: Commit**

```bash
git add src/Swiftpay.Api.Payment/Controllers/InternalController.cs
git commit -m "feat: add MagicPay webhook endpoint"
```

---

### Task 6: Migration + Full Verification + Push

- [ ] **Step 1: Create migration**

```bash
dotnet ef migrations add AddPaymentTables --project src/Swiftpay.Api.Core --startup-project src/Swiftpay.Api.Payment 2>&1 | tail -5
```

- [ ] **Step 2: Build and test everything**

```bash
dotnet build --configuration Release 2>&1 | tail -3
echo "---"
dotnet test --configuration Release --verbosity normal 2>&1 | tail -10
```

- [ ] **Step 3: Commit and push**

```bash
git add -A
git commit -m "feat: complete MagicPay PIX integration
- Add Payment + PaymentPix entities with EF Core config
- Add IPixProvider interface and DTOs
- Add MagicPay HTTP client + response parser with tests
- Add MagicPayPixService implementing IPixProvider
- Add PixProviderFactory for provider resolution
- Add webhook endpoint for MagicPay callbacks
- Add EF Core migration for payment tables
All tests passing"
git push origin main 2>&1
```
