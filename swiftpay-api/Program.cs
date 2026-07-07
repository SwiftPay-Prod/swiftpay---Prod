using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.Database;
using swiftpay_api.Extensions;
using swiftpay_api_core.Database;
using swiftpay_api_core.Extensions;

ThreadPool.SetMinThreads(100, 100);

var builder = WebApplication.CreateBuilder(args);

// Production startup safeguards
builder.AddProductionStartupSafeguards();

// Settings (Options Pattern)
builder.Services.AddAllSettings(builder.Configuration);

// Authorization & Authentication
builder.Services.AddAuthorization();
builder.Services.AddSwiftPayAuthentication(builder.Configuration);

// FastEndpoints & OpenAPI
builder.Services.AddFastEndpoints();
builder.Services.AddDocumentation();

builder.Services.AddHttpContextAccessor();

// Databases
builder.Services.AddDatabases();
builder.Services.AddHealthChecks(builder.Configuration);

// Valkey Cache (for session storage)
builder.Services.AddValkey(builder.Configuration);

// Hangfire (background jobs - uses Valkey/Redis)
builder.Services.AddHangfireServices(builder.Configuration);

// SignalR (must be before services that depend on IHubContext)
builder.Services.AddSignalRHubs();

// Core Services (shared with swiftpay-api-payment)
builder.Services.AddCoreServices();

// Internal Services
builder.Services.AddInternalServices();

// MassTransit RabbitMQ with Consumer
builder.Services.AddMassTransitWithConsumers(builder.Configuration);

// Payment API Client
builder.Services.AddPaymentApiClient();

// HttpClient for external services
builder.Services.AddHttpClient();

// CORS
builder.Services.AddSwiftPayCors(builder.Environment);

// Rate Limiter (Production only)
builder.Services.AddSwiftPayRateLimiter(builder.Environment);

// Kestrel Configuration
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxConcurrentConnections = 2000;
    options.Limits.MaxConcurrentUpgradedConnections = 2000;
    options.Limits.MinRequestBodyDataRate = null;
});

// MiniProfiler
builder.Services.AddMiniProfiler(options =>
{
    options.RouteBasePath = "/profiler";
    options.ResultsAuthorize = _ => true;
    options.ResultsListAuthorize = _ => true;
    options.PopupShowTimeWithChildren = true;
    options.TrackConnectionOpenClose = true;
}).AddEntityFramework();

var app = builder.Build();

await app.Services.EnsurePrimaryDatabaseCreatedAsync(PrimaryDbInitialize.Initialize);
await app.Services.EnsureLogDatabaseCreatedAsync();

await app.PreWarmDatabasePoolsAsync(builder.Configuration);

// Documentation (Development & Staging only)
app.UseDocumentation(app.Environment);

// Pipeline
app.UseSwiftPayPipeline(app.Environment);

// Hangfire recurring jobs
app.UseHangfireJobs();

app.Run();
// teste delta
// teste visual
// outra linha
