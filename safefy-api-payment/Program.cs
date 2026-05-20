using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Extensions;
using safefy_api_core.Services;
using safefy_api_payment.Extensions;
using safefy_api_payment.Services.Internal;

ThreadPool.SetMinThreads(100, 100);

var builder = WebApplication.CreateBuilder(args);

// Production startup safeguards
builder.AddProductionStartupSafeguards();

// Settings (Options Pattern)
builder.Services.AddAllSettings(builder.Configuration);

// Authorization & Authentication
builder.Services.AddAuthorization();
builder.Services.AddSafefyAuthentication(builder.Configuration);

// FastEndpoints & OpenAPI
builder.Services.AddFastEndpoints();
builder.Services.AddDocumentation();

builder.Services.AddHttpContextAccessor();

// Databases
builder.Services.AddDatabases();
builder.Services.AddHealthChecks(builder.Configuration);

// Core Services (shared with safefy-api)
builder.Services.AddCoreServices();

// Helper Services


// Internal Services
builder.Services.AddInternalServices();

// Acquirer Services
builder.Services.AddAcquirerServices();

// Sandbox Services (for simulation - never touches real acquirers)
builder.Services.AddSandboxServices();

// Payment Method Services (PIX, Credit Card, Boleto)
builder.Services.AddPaymentMethodServices();

// Payment Services
builder.Services.AddPaymentServices();

// Checkout Handlers
builder.Services.AddCheckoutHandlers();

// Background Services
builder.Services.AddHostedService<OrderReservationCleanupService>();
builder.Services.AddHostedService<StartupWarmupService>();

// MassTransit RabbitMQ with Consumers
builder.Services.AddMassTransitWithConsumers(builder.Configuration);

// Memory Cache for rate limiting
builder.Services.AddMemoryCache();

// HttpClient for webhooks with resilience
builder.Services.AddWebhookHttpClient();

// HttpClient for other external services
builder.Services.AddHttpClient();

// CORS
builder.Services.AddSafefyCors(builder.Configuration);

// SignalR
builder.Services.AddSignalR(hubOptions =>
{
    hubOptions.MaximumReceiveMessageSize = 32768;
});

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

await app.PreWarmDatabasePoolsAsync(builder.Configuration);

// Documentation
app.UseDocumentation();

// Pipeline
app.UseSafefyPipeline();

app.Run();
