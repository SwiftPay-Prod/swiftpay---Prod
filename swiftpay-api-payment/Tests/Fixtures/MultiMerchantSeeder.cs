using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Models.Acquirer;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api_payment.Tests.Fixtures;

/// <summary>
/// Seeder de dados para os 3 merchants extras usados no teste de fluxo completo da plataforma.
/// Alpha: taxa 1.5% (150bps) | Beta: taxa 2.0% (200bps) | Gamma: taxa 1.0% (100bps)
/// </summary>
public static class MultiMerchantSeeder
{
    // === Merchant Alpha (fee 1.5% = 150 bps) ===
    public static readonly Guid AlphaUserId = Guid.Parse("A0000000-0000-0000-0000-000000000001");
    public static readonly Guid AlphaMerchantId = Guid.Parse("A1111111-1111-1111-1111-111111111111");
    public static readonly Guid AlphaCredentialId = Guid.Parse("A2222222-2222-2222-2222-222222222222");
    public static readonly Guid AlphaMerchantAcquirerId = Guid.Parse("A3333333-3333-3333-3333-333333333333");
    public const string AlphaClientId = "pk_sandbox_alpha_fulltest_001";
    public const string AlphaClientSecret = "sk_sandbox_alpha_fulltest_secret_001";
    public const int AlphaFeeBps = 150;

    // === Merchant Beta (fee 2.0% = 200 bps) ===
    public static readonly Guid BetaUserId = Guid.Parse("B0000000-0000-0000-0000-000000000001");
    public static readonly Guid BetaMerchantId = Guid.Parse("B1111111-1111-1111-1111-111111111111");
    public static readonly Guid BetaCredentialId = Guid.Parse("B2222222-2222-2222-2222-222222222222");
    public static readonly Guid BetaMerchantAcquirerId = Guid.Parse("B3333333-3333-3333-3333-333333333333");
    public const string BetaClientId = "pk_sandbox_beta_fulltest_002";
    public const string BetaClientSecret = "sk_sandbox_beta_fulltest_secret_002";
    public const int BetaFeeBps = 200;

    // === Merchant Gamma (fee 1.0% = 100 bps) ===
    public static readonly Guid GammaUserId = Guid.Parse("C0000000-0000-0000-0000-000000000001");
    public static readonly Guid GammaMerchantId = Guid.Parse("C1111111-1111-1111-1111-111111111111");
    public static readonly Guid GammaCredentialId = Guid.Parse("C2222222-2222-2222-2222-222222222222");
    public static readonly Guid GammaMerchantAcquirerId = Guid.Parse("C3333333-3333-3333-3333-333333333333");
    public const string GammaClientId = "pk_sandbox_gamma_fulltest_003";
    public const string GammaClientSecret = "sk_sandbox_gamma_fulltest_secret_003";
    public const int GammaFeeBps = 100;

    /// <summary>
    /// Calcula a taxa cobrada da operação (floor) dado um valor e taxa em basis points.
    /// </summary>
    public static long CalculateFee(long amount, int feeBps)
        => (long)Math.Floor((decimal)amount * feeBps / 10_000m);

    /// <summary>
    /// Calcula o valor líquido da operação (amount - fee).
    /// </summary>
    public static long CalculateNet(long amount, int feeBps)
        => amount - CalculateFee(amount, feeBps);

    public static async Task SeedAsync(PrimaryDbContext context)
    {
        await SeedMerchantAsync(context, AlphaUserId, AlphaMerchantId, AlphaCredentialId, AlphaMerchantAcquirerId,
            "Alpha", AlphaClientId, AlphaClientSecret, AlphaFeeBps);

        await SeedMerchantAsync(context, BetaUserId, BetaMerchantId, BetaCredentialId, BetaMerchantAcquirerId,
            "Beta", BetaClientId, BetaClientSecret, BetaFeeBps);

        await SeedMerchantAsync(context, GammaUserId, GammaMerchantId, GammaCredentialId, GammaMerchantAcquirerId,
            "Gamma", GammaClientId, GammaClientSecret, GammaFeeBps);

        await context.SaveChangesAsync();
    }

    private static async Task SeedMerchantAsync(
        PrimaryDbContext context,
        Guid userId, Guid merchantId, Guid credentialId, Guid merchantAcquirerId,
        string label, string clientId, string clientSecret, int feeBps)
    {
        if (!await context.Users.AnyAsync(u => u.Id == userId))
        {
            context.Users.Add(new User
            {
                Id = userId,
                Name = $"Test Merchant {label} User",
                Email = $"merchant_{label.ToLower()}@test.swiftpay.com",
                Password = "hashed_password_test",
                Role = UserRole.Merchant,
                Status = UserStatus.Active,
                EmailVerified = true
            });
        }

        if (!await context.Merchants.AnyAsync(m => m.Id == merchantId))
        {
            context.Merchants.Add(new Merchant
            {
                Id = merchantId,
                UserId = userId,
                Name = $"Test Merchant {label}",
                Email = $"merchant_{label.ToLower()}@test.swiftpay.com",
                Status = MerchantStatus.Active,
                KycStatus = MerchantKycStatus.Approved
            });
        }

        if (!await context.MerchantSettings.AnyAsync(ms => ms.MerchantId == merchantId))
        {
            context.MerchantSettings.Add(new MerchantSettings
            {
                Id = Guid.CreateVersion7(),
                MerchantId = merchantId,
                PixApiFeeMode = FeeChargeMode.PercentageOnly,
                PixApiFeePercentage = feeBps,
                PixApiFeeFixed = null
            });
        }

        if (!await context.MerchantApiCredentials.AnyAsync(c => c.Id == credentialId))
        {
            context.MerchantApiCredentials.Add(new MerchantApiCredential
            {
                Id = credentialId,
                MerchantId = merchantId,
                Name = $"Test Sandbox Credential {label}",
                ClientId = clientId,
                ClientSecretHash = CryptoUtils.ComputeSha256Hash(clientSecret),
                Environment = ApiEnvironment.Sandbox,
                Status = MerchantApiCredentialStatus.Active
            });
        }

        if (!await context.MerchantAcquirers.AnyAsync(ma => ma.Id == merchantAcquirerId))
        {
            context.MerchantAcquirers.Add(new MerchantAcquirer
            {
                Id = merchantAcquirerId,
                MerchantId = merchantId,
                AcquirerId = SystemAcquirerIds.Bankizi,
                IsActive = true,
                IsDefault = true,
                Credentials = CredentialUtils.SerializeCredentials(new Dictionary<string, string>
                {
                    ["apiKey"] = "test_api_key",
                    ["clientId"] = "test_acquirer_client",
                    ["clientSecret"] = "test_acquirer_secret"
                })
            });
        }
    }
}
