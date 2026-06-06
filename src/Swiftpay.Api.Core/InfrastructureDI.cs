using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Polly;
using Resend;
using Swiftpay.Api.Core.Common;
using Swiftpay.Api.Core.Providers;
using Swiftpay.Api.Core.Providers.Coratri;
using Swiftpay.Api.Core.Providers.MagicPay;
using Swiftpay.Api.Core.Repositories;
using Swiftpay.Api.Core.Services;
using Swiftpay.Application.Common;
using Swiftpay.Application.Common.Interfaces;
using Swiftpay.Application.Services;
using Swiftpay.Infrastructure.Data;
using Swiftpay.Infrastructure.Repositories;
using Swiftpay.Infrastructure.Services;

namespace Swiftpay.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Database
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

        // HttpContext accessor (for CurrentUserService)
        services.AddHttpContextAccessor();

        // Services
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        // Repositories
        services.AddScoped<IPaymentLinkRepository, PaymentLinkRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ICompanyRepository, CompanyRepository>();
        services.AddScoped<ITransactionRepository, TransactionRepository>();
        services.AddScoped<IWithdrawalRepository, WithdrawalRepository>();
        services.AddScoped<IAccountRepository, AccountRepository>();
        services.AddScoped<ILedgerRepository, LedgerRepository>();
        services.AddScoped<ILedgerService, LedgerService>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Email
        services.AddResend(options => options.ApiToken = configuration["Resend:ApiKey"] ?? "");
        services.AddScoped<IEmailService, ResendEmailService>();

        // Webhook
        services.AddScoped<WebhookService>();

        // Payment services
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.Configure<FeeScheduleOptions>(configuration.GetSection("FeeSchedule"));
        services.AddSingleton<FeeCalculationService>();
        services.AddScoped<PixTransactionService>();
        services.AddScoped<BoletoTransactionService>();
        services.AddScoped<CardTransactionService>();

        // MagicPay provider with Polly resilience
        services.AddSingleton<MagicPayResponseParser>();
        services.AddHttpClient<MagicPayClient>(client =>
        {
            client.BaseAddress = new Uri("https://api.sistema-magicpay.com");
            client.Timeout = TimeSpan.FromSeconds(30);
            client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer",
                    configuration["MagicPay:ApiKey"] ?? "");
        })
        .AddTransientHttpErrorPolicy(policy =>
            policy.WaitAndRetryAsync(3, attempt => TimeSpan.FromMilliseconds(Math.Pow(2, attempt) * 200)))
        .AddTransientHttpErrorPolicy(policy =>
            policy.CircuitBreakerAsync(5, TimeSpan.FromSeconds(30)));
        services.AddScoped<IPaymentProvider, MagicPayPixService>();

        // Coratri provider
        services.AddSingleton<CoratriResponseParser>();
        services.AddHttpClient<CoratriClient>(client =>
        {
            client.BaseAddress = new Uri("https://api.coratri.com");
            client.Timeout = TimeSpan.FromSeconds(30);
        })
        .AddTransientHttpErrorPolicy(policy =>
            policy.WaitAndRetryAsync(3, attempt => TimeSpan.FromMilliseconds(Math.Pow(2, attempt) * 200)))
        .AddTransientHttpErrorPolicy(policy =>
            policy.CircuitBreakerAsync(5, TimeSpan.FromSeconds(30)));
        services.AddScoped<IPaymentProvider>(sp =>
        {
            var config = sp.GetRequiredService<IConfiguration>();
            var clientKey = config["Coratri:ClientKey"] ?? "";
            var clientSecret = config["Coratri:ClientSecret"] ?? "";
            var httpClientFactory = sp.GetRequiredService<IHttpClientFactory>();
            var httpClient = httpClientFactory.CreateClient("CoratriClient");
            var parser = sp.GetRequiredService<CoratriResponseParser>();
            var coratriClient = new CoratriClient(httpClient, parser, clientKey, clientSecret);
            return new CoratriPixService(coratriClient);
        });

        services.AddScoped<PixProviderFactory>();

        return services;
    }
}
