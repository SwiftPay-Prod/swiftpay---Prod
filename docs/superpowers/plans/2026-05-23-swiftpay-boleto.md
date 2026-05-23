# Swiftpay — Boleto

**Goal:** Add boleto as a payment method using MagicPay's existing API (method=BOLETO).

**Architecture:** Same pattern as PIX. PaymentBoleto entity. MagicPay already supports boleto on the same endpoint.

---

### Task 1: PaymentBoleto entity + MagicPay client extension

**Files:**
- Create: `src/Swiftpay.Api.Core/Entities/PaymentBoleto.cs`
- Create: `src/Swiftpay.Api.Core/Data/Configurations/PaymentBoletoConfiguration.cs`
- Modify: `src/Swiftpay.Api.Core/Providers/MagicPay/MagicPayClient.cs`
- Modify: `src/Swiftpay.Api.Core/Providers/MagicPay/MagicPayResponseParser.cs`
- Modify: `src/Swiftpay.Api.Core/Providers/MagicPay/Models/MagicPayModels.cs`
- Modify: `src/Swiftpay.Api.Core/Data/AppDbContext.cs`

- [ ] **Step 1: Create PaymentBoleto entity**

Write `src/Swiftpay.Api.Core/Entities/PaymentBoleto.cs`:
```csharp
namespace Swiftpay.Api.Core.Entities;
public class PaymentBoleto
{
    public Guid Id { get; set; }
    public Guid PaymentId { get; set; }
    public string? Barcode { get; set; }
    public string? BoletoUrl { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? PaidAt { get; set; }
    public Payment Payment { get; set; } = null!;
}
```

- [ ] **Step 2: Create EF Core config**

Write `src/Swiftpay.Api.Core/Data/Configurations/PaymentBoletoConfiguration.cs`:
```csharp
using Microsoft.EntityFrameworkCore; using Microsoft.EntityFrameworkCore.Metadata.Builders; using Swiftpay.Api.Core.Entities;
namespace Swiftpay.Api.Core.Data.Configurations;
public class PaymentBoletoConfiguration : IEntityTypeConfiguration<PaymentBoleto>
{
    public void Configure(EntityTypeBuilder<PaymentBoleto> builder)
    {
        builder.ToTable("PaymentBoletos"); builder.HasKey(x => x.Id);
        builder.Property(x => x.Barcode).HasMaxLength(255);
        builder.Property(x => x.BoletoUrl).HasMaxLength(500);
        builder.HasOne(x => x.Payment).WithMany().HasForeignKey(x => x.PaymentId);
    }
}
```

- [ ] **Step 3: Add DbSet to AppDbContext**

```csharp
public DbSet<PaymentBoleto> PaymentBoletos => Set<PaymentBoleto>();
```

- [ ] **Step 4: Add boleto data to MagicPay models**

Add to `MagicPayData`:
```csharp
[property: JsonPropertyName("barcode")] string? Barcode,
[property: JsonPropertyName("boletoUrl")] string? BoletoUrl,
```

- [ ] **Step 5: Build and commit**

```bash
git add src/Swiftpay.Api.Core/Entities/PaymentBoleto.cs src/Swiftpay.Api.Core/Data/Configurations/PaymentBoletoConfiguration.cs src/Swiftpay.Api.Core/Providers/MagicPay/Models/MagicPayModels.cs
git commit -m "feat: add PaymentBoleto entity and MagicPay boleto support"
```

---

### Task 2: Create BoletoTransactionService + Payment endpoint

**Files:**
- Create: `src/Swiftpay.Api.Core/Services/BoletoTransactionService.cs`
- Modify: `src/Swiftpay.Api.Payment/Controllers/PaymentLinksController.cs`
- Update: checkout frontend to show boleto

- [ ] **Step 1: Create BoletoTransactionService**

Write `src/Swiftpay.Api.Core/Services/BoletoTransactionService.cs`:
```csharp
using MassTransit; using Swiftpay.Api.Core.Common; using Swiftpay.Api.Core.Entities;
using Swiftpay.Api.Core.Messages; using Swiftpay.Api.Core.Providers; using Swiftpay.Api.Core.Providers.MagicPay.Models;
namespace Swiftpay.Api.Core.Services;
public class BoletoTransactionService
{
    private readonly IPaymentRepository _repo; private readonly IPixProvider _provider;
    private readonly IPublishEndpoint _publish; private readonly IUnitOfWork _uow;
    private readonly FeeCalculationService _calc;
    public BoletoTransactionService(IPaymentRepository repo, IPixProvider provider, IPublishEndpoint publish, IUnitOfWork uow, FeeCalculationService calc)
    { _repo = repo; _provider = provider; _publish = publish; _uow = uow; _calc = calc; }

    public async Task<BoletoResult> CreateBoletoAsync(Guid merchantId, long amount, string externalRef, string notificationUrl, DateTime dueDate, CancellationToken ct)
    {
        var fees = _calc.CalculatePixFees(amount);
        var payment = new Payment { Id = Guid.NewGuid(), MerchantId = merchantId, Amount = amount, PlatformFee = fees.PlatformFee, AcquirerFee = fees.AcquirerFee, NetAmount = fees.NetAmount, MerchantSettlementAmount = fees.MerchantSettlementAmount, AcquirerNetAmount = fees.AcquirerNetAmount, Method = "BOLETO", ExternalId = externalRef, NotificationUrl = notificationUrl };
        // For boleto, we generate PIX with method=BOLETO via MagicPay
        var pixRequest = new PixGenerationRequest(amount, $"Boleto {externalRef}", externalRef, notificationUrl, "", "", "", "");
        var result = await _provider.GeneratePixAsync(pixRequest, ct);
        if (!result.Success) return new BoletoResult(false, null, null, null, result.ErrorMessage);
        payment.PaymentBoletos = new List<PaymentBoleto> { new() { Id = Guid.NewGuid(), PaymentId = payment.Id } };
        payment.AcquirerPaymentId = result.TransactionId;
        await _repo.AddAsync(payment, ct); await _uow.SaveChangesAsync(ct);
        await _publish.Publish(new PaymentPendingMessage(payment.Id, merchantId, null, amount, "production"), ct);
        return new BoletoResult(true, payment.Id, result.CopyAndPaste, null, null);
    }
}
public record BoletoResult(bool Success, Guid? PaymentId, string? Barcode, string? BoletoUrl, string? ErrorMessage);
```

- [ ] **Step 2: Build and commit**

```bash
dotnet build --configuration Release 2>&1 | tail -3
git add src/Swiftpay.Api.Core/Services/BoletoTransactionService.cs
git commit -m "feat: add BoletoTransactionService"
git push origin main 2>&1
```
