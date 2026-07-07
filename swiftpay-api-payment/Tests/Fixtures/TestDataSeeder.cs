using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Models.Acquirer;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api_payment.Tests.Fixtures;

/// <summary>
/// Seeder de dados para os testes de integração.
/// Cria merchant, credenciais de API, adquirente e configura o ambiente de teste.
/// </summary>
public static class TestDataSeeder
{
    // IDs fixos para os testes
    public static readonly Guid TestUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    public static readonly Guid TestMerchantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public static readonly Guid TestCredentialId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    public static readonly Guid TestMerchantAcquirerId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    public static readonly Guid TestCustomerId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    
    // Credenciais de teste
    public const string TestClientId = "test_client_sandbox_abc123";
    public const string TestClientSecret = "test_secret_xyz789";
    
    /// <summary>
    /// Inicializa o banco com dados de teste.
    /// </summary>
    public static async Task SeedAsync(PrimaryDbContext context)
    {
        // 1. Criar System Accounts
        await CreateSystemAccountsAsync(context);
        
        // 2. Criar Acquirer (Bankizi)
        await CreateAcquirerAsync(context);
        
        // 3. Criar User de teste
        await CreateTestUserAsync(context);
        
        // 4. Criar Merchant de teste
        await CreateMerchantAsync(context);
        
        // 5. Criar MerchantSettings
        await CreateMerchantSettingsAsync(context);

        // 5.5. Criar PlatformSettings (necessário para CashoutService resolver taxas de saque)
        await CreatePlatformSettingsAsync(context);

        // 6. Criar credencial de API
        await CreateApiCredentialAsync(context);
        
        // 7. Criar MerchantAcquirer
        await CreateMerchantAcquirerAsync(context);
        
        // 8. Criar Customer de teste
        await CreateTestCustomerAsync(context);
        
        await context.SaveChangesAsync();
    }

    private static async Task CreateSystemAccountsAsync(PrimaryDbContext context)
    {
        var systemAccounts = new[]
        {
            new Account { Id = SystemAccountIds.PlatformBlocked, Type = AccountType.PlatformBlocked, Balance = 0, Currency = CurrencyType.BRL, Environment = ApiEnvironment.Production },
            new Account { Id = SystemAccountIds.PlatformPayoutsOut, Type = AccountType.PlatformPayoutsOut, Balance = 0, Currency = CurrencyType.BRL, Environment = ApiEnvironment.Production },
        };

        foreach (var acc in systemAccounts)
        {
            if (!await context.Accounts.AnyAsync(a => a.Id == acc.Id))
            {
                context.Accounts.Add(acc);
            }
        }
    }

    private static async Task CreateAcquirerAsync(PrimaryDbContext context)
    {
        if (await context.Acquirers.AnyAsync(a => a.Id == SystemAcquirerIds.Bankizi))
            return;

        var bankizi = new Acquirer
        {
            Id = SystemAcquirerIds.Bankizi,
            Name = "Bankizi",
            Code = "bankizi",
            Description = "Bankizi - PIX Gateway (Test)",
            Type = AcquirerType.Bankizi,
            IsActive = true,
            ApiBaseUrlProduction = "https://api.izipaynow.com",
            ApiBaseUrlSandbox = "https://api-sandbox.izipaynow.com",
            AuthType = "client_credentials",
            SupportsPix = true,
            SupportsBoleto = false,
            SupportsCreditCard = false,
            SupportsWithdrawal = true,
            SupportsRefund = true,
            WebhookToken = "whsec_test_token"
        };

        context.Acquirers.Add(bankizi);
    }

    private static async Task CreateTestUserAsync(PrimaryDbContext context)
    {
        if (await context.Users.AnyAsync(u => u.Id == TestUserId))
            return;

        var user = new User
        {
            Id = TestUserId,
            Name = "Test User",
            Email = "test@merchant.com",
            Password = "hashed_password_test",
            Role = UserRole.Merchant,
            Status = UserStatus.Active,
            EmailVerified = true
        };

        context.Users.Add(user);
    }

    private static async Task CreateMerchantAsync(PrimaryDbContext context)
    {
        if (await context.Merchants.AnyAsync(m => m.Id == TestMerchantId))
            return;

        var merchant = new Merchant
        {
            Id = TestMerchantId,
            UserId = TestUserId,
            Name = "Test Merchant",
            Email = "test@merchant.com",
            Status = MerchantStatus.Active,
            KycStatus = MerchantKycStatus.Approved
        };

        context.Merchants.Add(merchant);
    }

    private static async Task CreateMerchantSettingsAsync(PrimaryDbContext context)
    {
        if (await context.MerchantSettings.AnyAsync(ms => ms.MerchantId == TestMerchantId))
            return;

        var settings = new MerchantSettings
        {
            Id = Guid.CreateVersion7(),
            MerchantId = TestMerchantId,
            PixApiFeeMode = FeeChargeMode.PercentageOnly,
            PixApiFeePercentage = 150, // 1.5%
            PixApiFeeFixed = null,
            PixCheckoutFeeMode = FeeChargeMode.PercentageOnly,
            PixCheckoutFeePercentage = 200, // 2%
            PixCheckoutFeeFixed = null
        };

        context.MerchantSettings.Add(settings);
    }

    private static async Task CreateApiCredentialAsync(PrimaryDbContext context)
    {
        if (await context.MerchantApiCredentials.AnyAsync(mac => mac.Id == TestCredentialId))
            return;

        var credential = new MerchantApiCredential
        {
            Id = TestCredentialId,
            MerchantId = TestMerchantId,
            Name = "Test Sandbox Credential",
            ClientId = TestClientId,
            ClientSecretHash = CryptoUtils.ComputeSha256Hash(TestClientSecret),
            Environment = ApiEnvironment.Sandbox,
            Status = MerchantApiCredentialStatus.Active
        };

        context.MerchantApiCredentials.Add(credential);
    }

    private static async Task CreateMerchantAcquirerAsync(PrimaryDbContext context)
    {
        if (await context.MerchantAcquirers.AnyAsync(ma => ma.Id == TestMerchantAcquirerId))
            return;

        var merchantAcquirer = new MerchantAcquirer
        {
            Id = TestMerchantAcquirerId,
            MerchantId = TestMerchantId,
            AcquirerId = SystemAcquirerIds.Bankizi,
            IsActive = true,
            IsDefault = true,
            Credentials = CredentialUtils.SerializeCredentials(new Dictionary<string, string>
            {
                ["apiKey"] = "test_api_key",
                ["clientId"] = "test_acquirer_client",
                ["clientSecret"] = "test_acquirer_secret"
            })
        };

        context.MerchantAcquirers.Add(merchantAcquirer);
    }

    private static async Task CreateTestCustomerAsync(PrimaryDbContext context)
    {
        if (await context.Customers.AnyAsync(c => c.Id == TestCustomerId))
            return;

        var customer = new Customer
        {
            Id = TestCustomerId,
            MerchantId = TestMerchantId,
            ExternalId = "customer_test_001",
            Name = "Cliente de Teste",
            Email = "cliente@teste.com",
            Document = "12345678900",
            DocumentType = CustomerDocumentType.CPF,
            Phone = "+5511999998888",
            Status = CustomerStatus.Active,
            Environment = ApiEnvironment.Sandbox
        };

        context.Customers.Add(customer);
    }

    private static async Task CreatePlatformSettingsAsync(PrimaryDbContext context)
    {
        if (await context.PlatformSettings.AnyAsync())
            return;

        context.PlatformSettings.Add(new PlatformSettings
        {
            Id = Guid.CreateVersion7(),
            // PIX API fee: 1.5% (coerente com MerchantSettings)
            PixApiFeeMode = FeeChargeMode.PercentageOnly,
            PixApiFeePercentage = 150,
            // Taxa de saque: zero (testes assertem cashout.Fee == 0)
            WithdrawalFeeMode = FeeChargeMode.FixedOnly,
            WithdrawalFeeFixed = 0,
            WithdrawalFeePercentage = 0,
            MinWithdrawalAmount = 1000,
            // Automático para que cashouts vão para Processing e possam ser simulados
            WithdrawalApprovalMode = WithdrawalApprovalMode.Automatic
        });
    }
}
