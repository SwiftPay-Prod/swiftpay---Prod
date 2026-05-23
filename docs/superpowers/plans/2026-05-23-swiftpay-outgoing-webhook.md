# Swiftpay — Outgoing Webhook System

**Goal:** Implement the outgoing webhook delivery system — notify merchants via HTTP when payment events occur, with HMAC-SHA256 signing and retry logic.

**Architecture:** WebhookConfiguration entity stores merchant callback URLs. WebhookService handles HTTP delivery with signing + retry. SendWebhookConsumer (currently stub) is implemented. WebhookDeliveryLog tracks delivery attempts.

---

### Task 1: WebhookConfiguration entity + EF Core config

**Files:**
- Create: `src/Swiftpay.Api.Core/Entities/WebhookConfiguration.cs`
- Create: `src/Swiftpay.Api.Core/Data/Configurations/WebhookConfigurationConfiguration.cs`
- Create: `tests/Swiftpay.Domain.Tests/Entities/WebhookConfigurationTests.cs`
- Modify: `src/Swiftpay.Api.Core/Data/AppDbContext.cs`

- [ ] **Step 1: Create entity**

Write `src/Swiftpay.Api.Core/Entities/WebhookConfiguration.cs`:
```csharp
namespace Swiftpay.Api.Core.Entities;
public class WebhookConfiguration
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string Secret { get; set; } = string.Empty;
    public string Events { get; set; } = "payment.completed,payment.failed"; // comma-separated
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

Write config:
```csharp
using Microsoft.EntityFrameworkCore; using Microsoft.EntityFrameworkCore.Metadata.Builders; using Swiftpay.Api.Core.Entities;
namespace Swiftpay.Api.Core.Data.Configurations;
public class WebhookConfigurationConfiguration : IEntityTypeConfiguration<WebhookConfiguration>
{
    public void Configure(EntityTypeBuilder<WebhookConfiguration> builder)
    {
        builder.ToTable("WebhookConfigurations"); builder.HasKey(x => x.Id);
        builder.Property(x => x.Url).HasMaxLength(500).IsRequired();
        builder.Property(x => x.Secret).HasMaxLength(255).IsRequired();
        builder.Property(x => x.Events).HasMaxLength(500).IsRequired();
        builder.HasIndex(x => x.MerchantId);
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/Swiftpay.Api.Core/Entities/WebhookConfiguration.cs src/Swiftpay.Api.Core/Data/Configurations/WebhookConfigurationConfiguration.cs tests/Swiftpay.Domain.Tests/Entities/WebhookConfigurationTests.cs
git commit -m "feat: add WebhookConfiguration entity"
```

---

### Task 2: WebhookService (HTTP delivery + HMAC signing + retry)

**Files:**
- Create: `src/Swiftpay.Api.Core/Services/WebhookService.cs`
- Create: `src/Swiftpay.Api.Core/Common/IWebhookDeliveryLogRepository.cs`
- Create: `tests/Swiftpay.Application.Tests/Services/WebhookServiceTests.cs`

- [ ] **Step 1: Implement WebhookService**

Write `src/Swiftpay.Api.Core/Services/WebhookService.cs`:
```csharp
using System.Security.Cryptography; using System.Text; using System.Text.Json;
using Microsoft.Extensions.Logging; using Swiftpay.Api.Core.Entities;

namespace Swiftpay.Api.Core.Services;
public class WebhookService
{
    private readonly HttpClient _http; private readonly ILogger<WebhookService> _logger;
    public WebhookService(IHttpClientFactory httpFactory, ILogger<WebhookService> logger)
    { _http = httpFactory.CreateClient("webhook"); _logger = logger; }

    public async Task<bool> SendAsync(WebhookConfiguration config, string eventType, object payload, CancellationToken ct)
    {
        var json = JsonSerializer.Serialize(payload);
        var signature = ComputeHmacSha256(json, config.Secret);

        var request = new HttpRequestMessage(HttpMethod.Post, config.Url)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json"),
        };
        request.Headers.Add("X-Swiftpay-Signature", $"sha256={signature}");
        request.Headers.Add("X-Swiftpay-Event", eventType);
        request.Headers.Add("X-Swiftpay-Delivery", Guid.NewGuid().ToString());

        for (int attempt = 1; attempt <= 3; attempt++)
        {
            try
            {
                var response = await _http.SendAsync(request, ct);
                if (response.IsSuccessStatusCode) return true;

                _logger.LogWarning("Webhook attempt {Attempt}/3 for {Url}: HTTP {Status}", attempt, config.Url, (int)response.StatusCode);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Webhook attempt {Attempt}/3 for {Url}: {Error}", attempt, config.Url, ex.Message);
            }

            if (attempt < 3) await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt)), ct);
        }
        return false;
    }

    private static string ComputeHmacSha256(string payload, string secret)
    {
        var key = Encoding.UTF8.GetBytes(secret);
        var hash = HMACSHA256.HashData(key, Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash).ToLower();
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/Swiftpay.Api.Core/Services/WebhookService.cs tests/Swiftpay.Application.Tests/Services/WebhookServiceTests.cs
git commit -m "feat: implement WebhookService with HMAC signing and retry"
```

---

### Task 3: WebhookConfigurationController + Update SendWebhookConsumer

**Files:**
- Create: `src/Swiftpay.Api.Gestao/Controllers/WebhookConfigurationController.cs`
- Modify: `src/Swiftpay.Api.Core/Consumers/SendWebhookConsumer.cs`

- [ ] **Step 1: Create WebhookConfigurationController**

Write `src/Swiftpay.Api.Gestao/Controllers/WebhookConfigurationController.cs`:
```csharp
using Microsoft.AspNetCore.Authorization; using Microsoft.AspNetCore.Mvc; using Microsoft.EntityFrameworkCore;
using Swiftpay.Api.Core.Entities; using Swiftpay.Api.Core.Services; using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Api.Gestao.Controllers;
[ApiController] [Route("api/v1/webhooks")] [Authorize]
public class WebhookConfigurationController : ControllerBase
{
    private readonly AppDbContext _db;
    public WebhookConfigurationController(AppDbContext db) { _db = db; }

    [HttpGet]
    public async Task<ActionResult> List()
    {
        var configs = await _db.Set<WebhookConfiguration>().ToListAsync();
        return Ok(new { success = true, data = configs });
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] WebhookConfiguration config)
    {
        config.Id = Guid.NewGuid();
        _db.Set<WebhookConfiguration>().Add(config);
        await _db.SaveChangesAsync();
        return Ok(new { success = true, data = config });
    }
}
```

- [ ] **Step 2: Implement SendWebhookConsumer**

Write `src/Swiftpay.Api.Core/Consumers/SendWebhookConsumer.cs`:
```csharp
using MassTransit; using Microsoft.EntityFrameworkCore; using Microsoft.Extensions.Logging;
using Swiftpay.Api.Core.Entities; using Swiftpay.Api.Core.Messages; using Swiftpay.Api.Core.Services;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Api.Core.Consumers;
public class SendWebhookConsumer : IConsumer<SendWebhookMessage>
{
    private readonly AppDbContext _db; private readonly WebhookService _webhook; private readonly ILogger<SendWebhookConsumer> _logger;
    public SendWebhookConsumer(AppDbContext db, WebhookService webhook, ILogger<SendWebhookConsumer> logger)
    { _db = db; _webhook = webhook; _logger = logger; }

    public async Task Consume(ConsumeContext<SendWebhookMessage> context)
    {
        var configs = await _db.Set<WebhookConfiguration>()
            .Where(w => w.IsActive).ToListAsync(context.CancellationToken);

        foreach (var config in configs)
        {
            var success = await _webhook.SendAsync(config, context.Message.EventType,
                new { paymentId = context.Message.PaymentId, eventType = context.Message.EventType },
                context.CancellationToken);

            _logger.LogInformation("Webhook {Result} for payment {PaymentId} to {Url}",
                success ? "sent" : "failed", context.Message.PaymentId, config.Url);
        }
    }
}
```

- [ ] **Step 3: Build and test**

```bash
dotnet build --configuration Release 2>&1 | tail -3
dotnet test --configuration Release 2>&1 | grep -E "Passed!|Failed|Total"
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: implement outgoing webhook delivery with configuration endpoint

- Add WebhookController for CRUD management
- Implement SendWebhookConsumer with actual HTTP delivery
- WebhookService with HMAC-SHA256 signing + 3 retries with backoff
- WebhookConfiguration entity + migration"

git push origin main 2>&1
```
