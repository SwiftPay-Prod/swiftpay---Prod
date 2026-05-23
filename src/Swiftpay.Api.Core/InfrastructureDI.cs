using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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

        return services;
    }
}
