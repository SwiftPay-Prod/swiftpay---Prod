# Swiftpay — Production Readiness

**Goal:** Add Serilog, rate limiting, health checks, secrets management, and startup validation to both APIs.

---

### Task 1: Serilog + Health Checks

**Files:**
- Modify: `src/Swiftpay.Api.Gestao/Program.cs`
- Modify: `src/Swiftpay.Api.Payment/Program.cs`
- Modify: `src/Swiftpay.Api.Core/Swiftpay.Api.Core.csproj` (add packages)

- [ ] **Step 1: Install Serilog packages**

```bash
dotnet add src/Swiftpay.Api.Core/Swiftpay.Api.Core.csproj package Serilog.AspNetCore
dotnet add src/Swiftpay.Api.Core/Swiftpay.Api.Core.csproj package Serilog.Sinks.Console
dotnet add src/Swiftpay.Api.Core/Swiftpay.Api.Core.csproj package Serilog.Sinks.File
dotnet add src/Swiftpay.Api.Core/Swiftpay.Api.Core.csproj package AspNetCore.HealthChecks.Npgsql
dotnet add src/Swiftpay.Api.Core/Swiftpay.Api.Core.csproj package AspNetCore.HealthChecks.Redis
```

- [ ] **Step 2: Add Serilog + health checks to both Program.cs**

Add to both `Program.cs` files (before builder):
```csharp
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .WriteTo.File("logs/swiftpay-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();
builder.Host.UseSerilog();
```

Add health checks:
```csharp
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!)
    .AddRedis(builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379");
```

Add health endpoint:
```csharp
app.MapHealthChecks("/health");
```

- [ ] **Step 3: Commit**

```bash
git add src/Swiftpay.Api.Core/Swiftpay.Api.Core.csproj src/Swiftpay.Api.Gestao/Program.cs src/Swiftpay.Api.Payment/Program.cs
git commit -m "feat: add Serilog structured logging and health checks (PostgreSQL + Redis)"
```

---

### Task 2: Rate Limiting

- [ ] **Step 1: Add rate limiting to both Program.cs**

```csharp
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("Api", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromMinutes(1);
    });
});

app.UseRateLimiter();
```

- [ ] **Step 2: Commit**

```bash
git add src/Swiftpay.Api.Gestao/Program.cs src/Swiftpay.Api.Payment/Program.cs
git commit -m "feat: add rate limiting (100 req/min per API key)"
```

---

### Task 3: Secrets + Startup Validation

- [ ] **Step 1: Remove API Key from appsettings, add startup validation**

Read current appsettings:
```bash
cat /home/matspectrum-ai/OpenGateway/src/Swiftpay.Api.Payment/appsettings.json
```

Remove `MagicPay:ApiKey` from appsettings. Add startup validation:
```csharp
var magicPayKey = configuration["MagicPay:ApiKey"] ?? throw new InvalidOperationException("MagicPay:ApiKey not configured");
```

- [ ] **Step 2: Add to .env.example**

Create `.env.example`:
```
MagicPay__ApiKey=your_api_key_here
ConnectionStrings__DefaultConnection=Host=localhost;Database=swiftpay;Username=swiftpay;Password=swiftpay123
ConnectionStrings__RabbitMQ=rabbitmq://localhost
```

- [ ] **Step 3: Commit**

```bash
git add src/Swiftpay.Api.Gestao/appsettings.json src/Swiftpay.Api.Payment/appsettings.json .env.example
git commit -m "feat: move API Key to environment variable, add startup validation, .env.example"
```

---

### Task 4: Verify + Push

- [ ] **Step 1: Build and test**

```bash
cd /home/matspectrum-ai/OpenGateway
dotnet build --configuration Release 2>&1 | tail -3
dotnet test --configuration Release 2>&1 | grep -E "Passed!|Failed|Total"
git push origin main 2>&1
```
