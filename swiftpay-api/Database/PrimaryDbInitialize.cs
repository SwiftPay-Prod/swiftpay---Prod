using Microsoft.EntityFrameworkCore;
using safefy_api_core.Constants;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using BCrypt.Net;
using System.Text.Json;

namespace safefy_api.Database;

public class PrimaryDbInitialize
{
    public static void Initialize(PrimaryDbContext context)
    {
        try
        {
            if (!context.Database.CanConnect())
                throw new Exception("Database not accessible.");

            InitializePlatformSettings(context);
            InitializeWayneProtocolSettings(context);
            InitializeSystemAccounts(context);
            InitializeSystemUsers(context);
            AcquirerInitializer.UpdateAcquirerCredentialSchemas(context);
            AcquirerInitializer.UpdateHunterPayConfiguration(context);
            AcquirerInitializer.UpdateHeartPayConfiguration(context);
            AcquirerInitializer.UpdateActivePaymentsWithdrawalSecretSchema(context);
            AcquirerInitializer.UpdateAccithusProviderCategory(context);
            InitializeAchievements(context);
            InitializeLevelConfigs(context);

            context.SaveChanges();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error on PrimaryDbInitialize.Initialize: {ex.Message}");
            throw;
        }
    }

    private static void InitializePlatformSettings(PrimaryDbContext context)
    {
        if (!context.PlatformSettings.Any())
        {
            var platformSettings = new PlatformSettings
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                // PIX Limits
                PixMinTransactionAmount = 100, // R$ 1,00
                PixMaxTransactionAmount = 100000000, // R$ 1.000.000,00
                PixTimeoutMinutes = 30,
                PixEnabled = true,
                // PIX API Fee (1.5%)
                PixApiFeeMode = FeeChargeMode.PercentageOnly,
                PixApiFeeFixed = 0,
                PixApiFeePercentage = 150, // 1.5%
                // PIX Checkout Fee (2%)
                PixCheckoutFeeMode = FeeChargeMode.PercentageOnly,
                PixCheckoutFeeFixed = 0,
                PixCheckoutFeePercentage = 200, // 2%
                PixPaymentLinkBaseUrl = string.Empty,
                BoletoPaymentLinkBaseUrl = string.Empty,
                CreditCardPaymentLinkBaseUrl = string.Empty,
                PaymentLinkDomainOptionsJson = string.Empty,
                BoletoProxyBaseUrl = string.Empty,
                // Withdrawal Fee (R$ 2,00 fixed)
                WithdrawalFeeMode = FeeChargeMode.FixedOnly,
                WithdrawalFeeFixed = 200, // R$ 2,00
                WithdrawalFeePercentage = 0,
                MinWithdrawalAmount = 1000, // R$ 10,00
                WithdrawalApprovalMode = WithdrawalApprovalMode.Manual, // Saques requerem aprovação do admin
                BoletoEnabled = false,
                CreditCardEnabled = false,
                WithdrawalEnabled = true,
                SelfNominalSwitchEnabled = true,
                // Rate Limiting
                RateLimitPerMinute = 60,
                RateLimitPerHour = 1000,
                RateLimitPerDay = 10000,
                // Referral Settings
                ReferralDurationMonths = 12,
                ReferralCommissionPercentage = 1000, // 10%
                ReferralCommissionWithdrawalIntervalValue = 1,
                ReferralCommissionWithdrawalIntervalUnit = ReferralWithdrawalIntervalUnit.Days,
                ReferralCommissionMinWithdrawalAmount = 1000,
                ReferralCommissionWithdrawalFeeFixed = 0
            };

            context.PlatformSettings.Add(platformSettings);
        }
    }

    private static void InitializeSystemAccounts(PrimaryDbContext context)
    {
        context.Database.ExecuteSqlRaw("DELETE FROM \"Accounts\" WHERE \"Type\" = 'PlatformAvailable';");

        var systemAccounts = new[]
        {
            (Id: SystemAccountIds.PlatformBlocked,    Type: AccountType.PlatformBlocked),
            (Id: SystemAccountIds.PlatformPayoutsOut, Type: AccountType.PlatformPayoutsOut),
        };

        var now = DateTime.UtcNow;
        foreach (var acc in systemAccounts)
        {
            if (!context.Accounts.IgnoreQueryFilters().Any(a => a.Id == acc.Id))
            {
                context.Accounts.Add(new Account
                {
                    Id = acc.Id,
                    Type = acc.Type,
                    Balance = 0,
                    Currency = CurrencyType.BRL,
                    Environment = ApiEnvironment.Production,
                    CreatedAt = now,
                    UpdatedAt = now
                });
            }
        }
    }

    private static void InitializeWayneProtocolSettings(PrimaryDbContext context)
    {
        var now = DateTime.UtcNow;

        var defaults = new[]
        {
            (Environment: ApiEnvironment.Production, Json: JsonSerializer.Serialize(new { IsEnabled = false, CycleVolume = 100, SamplingRatePercent = 0 })),
            (Environment: ApiEnvironment.Sandbox, Json: JsonSerializer.Serialize(new { IsEnabled = false, CycleVolume = 100, SamplingRatePercent = 0 }))
        };

        foreach (var item in defaults)
        {
            var exists = context.SystemInternalConfigs.IgnoreQueryFilters().Any(c =>
                c.Key == WayneProtocolConstants.ConfigKey && c.Environment == item.Environment);

            if (exists)
                continue;

            context.SystemInternalConfigs.Add(new SystemInternalConfig
            {
                Id = Guid.CreateVersion7(),
                Key = WayneProtocolConstants.ConfigKey,
                Environment = item.Environment,
                JsonValue = item.Json,
                UpdatedByUserId = SystemUserIds.Admin,
                CreatedAt = now,
                UpdatedAt = now
            });
        }
    }

    private static void InitializeSystemUsers(PrimaryDbContext context)
    {
        if (!context.Users.Any(u => u.Id == SystemUserIds.Admin))
        {
            var adminUser = new User
            {
                Id = SystemUserIds.Admin,
                Name = "Administrador",
                Email = "admin@safefypay.com.br",
                Password = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Role = UserRole.Admin,
                Status = UserStatus.Active,
                EmailVerified = true
            };

            context.Users.Add(adminUser);
        }
    }

    private static void InitializeAchievements(PrimaryDbContext context)
    {
        var now = DateTime.UtcNow;
        var achievements = new Achievement[]
        {
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000001"), Key = "first-sell",     Title = "Primeira Venda",   Subtitle = "O início de tudo",       Description = "Você processou seu primeiro pagamento na plataforma.",                   ImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/achievements/first-sell.png",      Type = AchievementType.FirstSell,       ThresholdAmount = null,           SortOrder = 0,  IsActive = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000002"), Key = "first-checkout",  Title = "Primeiro Checkout", Subtitle = "Vitrine aberta",         Description = "Você realizou sua primeira venda pelo link de checkout.",                 ImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/achievements/first-checkout.png",  Type = AchievementType.FirstCheckout,   ThresholdAmount = null,           SortOrder = 1,  IsActive = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000003"), Key = "vol-5k",          Title = "R$ 5 mil",          Subtitle = "Primeiros passos",       Description = "Você acumulou R$ 5.000 em volume de pagamentos aprovados.",              ImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/achievements/5k-total-volume.png",          Type = AchievementType.VolumeThreshold, ThresholdAmount = 500_000L,       SortOrder = 2,  IsActive = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000004"), Key = "vol-10k",         Title = "R$ 10 mil",         Subtitle = "Engrenagens girando",    Description = "Você acumulou R$ 10.000 em volume de pagamentos aprovados.",             ImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/achievements/10k-total-volume.png",         Type = AchievementType.VolumeThreshold, ThresholdAmount = 1_000_000L,     SortOrder = 3,  IsActive = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000005"), Key = "vol-50k",         Title = "R$ 50 mil",         Subtitle = "Conquistando terreno",  Description = "Você acumulou R$ 50.000 em volume de pagamentos aprovados.",             ImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/achievements/50k-total-volume.png",         Type = AchievementType.VolumeThreshold, ThresholdAmount = 5_000_000L,     SortOrder = 4,  IsActive = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000006"), Key = "vol-100k",        Title = "R$ 100 mil",        Subtitle = "Nível acima",           Description = "Você acumulou R$ 100.000 em volume de pagamentos aprovados.",            ImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/achievements/100k-total-volume.png",        Type = AchievementType.VolumeThreshold, ThresholdAmount = 10_000_000L,    SortOrder = 5,  IsActive = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000007"), Key = "vol-250k",        Title = "R$ 250 mil",        Subtitle = "Velocidade crescente",  Description = "Você acumulou R$ 250.000 em volume de pagamentos aprovados.",            ImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/achievements/250k-total-volume.png",        Type = AchievementType.VolumeThreshold, ThresholdAmount = 25_000_000L,    SortOrder = 6,  IsActive = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000008"), Key = "vol-500k",        Title = "R$ 500 mil",        Subtitle = "Meio milhão",           Description = "Você acumulou R$ 500.000 em volume de pagamentos aprovados.",            ImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/achievements/500k-total-volume.png",        Type = AchievementType.VolumeThreshold, ThresholdAmount = 50_000_000L,    SortOrder = 7,  IsActive = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000009"), Key = "vol-1m",          Title = "R$ 1 milhão",       Subtitle = "Clube do milhão",       Description = "Você acumulou R$ 1.000.000 em volume de pagamentos aprovados.",          ImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/achievements/1m-total-volume.png",          Type = AchievementType.VolumeThreshold, ThresholdAmount = 100_000_000L,   SortOrder = 8,  IsActive = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000010"), Key = "vol-2m",          Title = "R$ 2 milhões",      Subtitle = "Aceleração total",      Description = "Você acumulou R$ 2.000.000 em volume de pagamentos aprovados.",          ImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/achievements/2m-total-volume.png",          Type = AchievementType.VolumeThreshold, ThresholdAmount = 200_000_000L,   SortOrder = 9,  IsActive = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000011"), Key = "vol-5m",          Title = "R$ 5 milhões",      Subtitle = "Liga dos grandes",      Description = "Você acumulou R$ 5.000.000 em volume de pagamentos aprovados.",          ImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/achievements/5m-total-volume.png",          Type = AchievementType.VolumeThreshold, ThresholdAmount = 500_000_000L,   SortOrder = 10, IsActive = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000012"), Key = "vol-10m",         Title = "R$ 10 milhões",     Subtitle = "Elite",                 Description = "Você acumulou R$ 10.000.000 em volume de pagamentos aprovados.",         ImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/achievements/10m-total-volume.png",         Type = AchievementType.VolumeThreshold, ThresholdAmount = 1_000_000_000L, SortOrder = 11, IsActive = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000013"), Key = "vol-25m",         Title = "R$ 25 milhões",     Subtitle = "Inatingível",           Description = "Você acumulou R$ 25.000.000 em volume de pagamentos aprovados.",         ImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/achievements/25m-total-volume.png",         Type = AchievementType.VolumeThreshold, ThresholdAmount = 2_500_000_000L, SortOrder = 12, IsActive = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000014"), Key = "vol-50m",         Title = "R$ 50 milhões",     Subtitle = "Lendário",              Description = "Você acumulou R$ 50.000.000 em volume de pagamentos aprovados.",         ImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/achievements/50m-total-volume.png",         Type = AchievementType.VolumeThreshold, ThresholdAmount = 5_000_000_000L, SortOrder = 13, IsActive = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000015"), Key = "vol-100m",        Title = "R$ 100 milhões",    Subtitle = "Além dos limites",      Description = "Você acumulou R$ 100.000.000 em volume de pagamentos aprovados.",        ImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/achievements/100m-total-volume.png",        Type = AchievementType.VolumeThreshold, ThresholdAmount = 10_000_000_000L, SortOrder = 14, IsActive = true, CreatedAt = now, UpdatedAt = now },
        };

        var existingKeys = context.Achievements.Select(a => a.Key).ToHashSet();
        foreach (var achievement in achievements.Where(a => !existingKeys.Contains(a.Key)))
            context.Achievements.Add(achievement);
    }

    private static void InitializeLevelConfigs(PrimaryDbContext context)
    {
        var now = DateTime.UtcNow;
        var levels = new LevelConfig[]
        {
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000001"), Level = MerchantLevel.Iron,          DisplayName = "Iron",          MinVolume = 0L,             MaxVolume = 1_000_000L,          SortOrder = 0,  BorderImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/border-level/border-iron.png",          CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000002"), Level = MerchantLevel.Bronze,        DisplayName = "Bronze",        MinVolume = 1_000_000L,     MaxVolume = 10_000_000L,         SortOrder = 1,  BorderImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/border-level/border-bronze.png",        CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000003"), Level = MerchantLevel.Silver,        DisplayName = "Silver",        MinVolume = 10_000_000L,    MaxVolume = 25_000_000L,         SortOrder = 2,  BorderImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/border-level/border-silver.png",        CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000004"), Level = MerchantLevel.GoldStart,     DisplayName = "Gold Start",    MinVolume = 25_000_000L,    MaxVolume = 50_000_000L,         SortOrder = 3,  BorderImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/border-level/border-gold-start.png",    CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000005"), Level = MerchantLevel.GoldPro,       DisplayName = "Gold Pro",      MinVolume = 50_000_000L,    MaxVolume = 100_000_000L,        SortOrder = 4,  BorderImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/border-level/border-gold-pro.png",      CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000006"), Level = MerchantLevel.Diamond,       DisplayName = "Diamond",       MinVolume = 100_000_000L,   MaxVolume = 200_000_000L,        SortOrder = 5,  BorderImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/border-level/border-diamond.png",       CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000007"), Level = MerchantLevel.PlatinumStart, DisplayName = "Platinum Start", MinVolume = 200_000_000L,  MaxVolume = 500_000_000L,        SortOrder = 6,  BorderImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/border-level/border-platinum-start.png", CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000008"), Level = MerchantLevel.PlatinumPro,   DisplayName = "Platinum Pro",  MinVolume = 500_000_000L,   MaxVolume = 1_000_000_000L,      SortOrder = 7,  BorderImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/border-level/border-platinum-pro.png",   CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000009"), Level = MerchantLevel.Titanium,      DisplayName = "Titanium",      MinVolume = 1_000_000_000L, MaxVolume = 2_500_000_000L,      SortOrder = 8,  BorderImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/border-level/border-titanium.png",      CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000010"), Level = MerchantLevel.Black,         DisplayName = "Black",         MinVolume = 2_500_000_000L, MaxVolume = 5_000_000_000L,      SortOrder = 9,  BorderImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/border-level/border-black.png",         CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000011"), Level = MerchantLevel.Legend,        DisplayName = "Legend",        MinVolume = 5_000_000_000L, MaxVolume = 10_000_000_000L,     SortOrder = 10, BorderImageUrl = "https://safefy-prod.nyc3.cdn.digitaloceanspaces.com/border-level/border-legend.png",        CreatedAt = now, UpdatedAt = now },
        };

        var existingLevelConfigs = context.LevelConfigs.ToList();
        var existingLevels = existingLevelConfigs.Select(lc => lc.Level).ToHashSet();

        foreach (var level in levels.Where(l => !existingLevels.Contains(l.Level)))
            context.LevelConfigs.Add(level);

        foreach (var existing in existingLevelConfigs.Where(lc => lc.BorderImageUrl == null))
        {
            var seed = levels.FirstOrDefault(l => l.Level == existing.Level);
            if (seed?.BorderImageUrl != null)
                existing.BorderImageUrl = seed.BorderImageUrl;
        }
    }

}
