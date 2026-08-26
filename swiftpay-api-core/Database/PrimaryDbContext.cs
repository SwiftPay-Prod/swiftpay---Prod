using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Database;

public class PrimaryDbContext : DbContext, IDataProtectionKeyContext
{
    private readonly IEnvironmentProvider? _environmentProvider;

    /// <summary>
    /// Gets the current environment dynamically.
    /// For HTTP requests: reads from X-Api-Environment header.
    /// For background jobs/consumers: reads from AsyncLocal set via HybridEnvironmentProvider.SetEnvironment().
    /// If no provider is available, defaults to Production environment.
    /// </summary>
    private ApiEnvironment CurrentEnvironment => _environmentProvider?.CurrentEnvironment ?? ApiEnvironment.Production;

    /// <summary>
    /// Constructor with optional environment provider.
    /// The environment is evaluated dynamically at query time, not at construction time.
    /// This allows consumers to set the environment via HybridEnvironmentProvider.SetEnvironment()
    /// AFTER the DbContext is created.
    /// </summary>
    public PrimaryDbContext(DbContextOptions<PrimaryDbContext> options, IEnvironmentProvider? environmentProvider = null) : base(options)
    {
        _environmentProvider = environmentProvider;
    }

    public DbSet<DataProtectionKey> DataProtectionKeys { get; set; }

    public DbSet<User> Users { get; set; }
    public DbSet<Merchant> Merchants { get; set; }
    public DbSet<MerchantKyc> MerchantKycs { get; set; }
    public DbSet<MerchantKycPendingItem> MerchantKycPendingItems { get; set; }
    public DbSet<MerchantSettings> MerchantSettings { get; set; }
    public DbSet<MerchantApiCredential> MerchantApiCredentials { get; set; }
    public DbSet<PlatformSettings> PlatformSettings { get; set; }
    public DbSet<Account> Accounts { get; set; }
    public DbSet<LedgerTransaction> LedgerTransactions { get; set; }
    public DbSet<LedgerEntry> LedgerEntries { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<PaymentLink> PaymentLinks { get; set; }
    public DbSet<PaymentPix> PaymentsPix { get; set; }
    public DbSet<PaymentBoleto> PaymentsBoleto { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<Payout> Payouts { get; set; }
    public DbSet<Checkout> Checkouts { get; set; }
    public DbSet<CheckoutConfig> CheckoutConfigs { get; set; }
    public DbSet<CheckoutProduct> CheckoutProducts { get; set; }
    public DbSet<CheckoutTemplate> CheckoutTemplates { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Variant> Variants { get; set; }
    public DbSet<Coupon> Coupons { get; set; }
    public DbSet<Acquirer> Acquirers { get; set; }
    public DbSet<AcquirerPixNominalHistory> AcquirerPixNominalHistories { get; set; }
    public DbSet<MerchantAcquirer> MerchantAcquirers { get; set; }
    public DbSet<MerchantIntegration> MerchantIntegrations { get; set; }
    public DbSet<MerchantNominalAbTest> MerchantNominalAbTests { get; set; }
    public DbSet<MerchantPayoutAccount> MerchantPayoutAccounts { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<AdminDashboardCache> AdminDashboardCaches { get; set; }
    public DbSet<MerchantDashboardCache> MerchantDashboardCaches { get; set; }
    public DbSet<AcquirerDashboardCache> AcquirerDashboardCaches { get; set; }
    public DbSet<PlatformBalanceCache> PlatformBalanceCaches { get; set; }
    public DbSet<MerchantBalance> MerchantBalances { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<PasswordResetCode> PasswordResetCodes { get; set; }
    public DbSet<PasswordChangeCode> PasswordChangeCodes { get; set; }
    public DbSet<EmailConfirmationToken> EmailConfirmationTokens { get; set; }
    public DbSet<MerchantDeletionCode> MerchantDeletionCodes { get; set; }
    public DbSet<PayoutAccountVerificationCode> PayoutAccountVerificationCodes { get; set; }
    public DbSet<ApiCredentialCode> ApiCredentialCodes { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<StoredFile> StoredFiles { get; set; }
    public DbSet<TrustedDevice> TrustedDevices { get; set; }
    public DbSet<DeviceVerificationCode> DeviceVerificationCodes { get; set; }
    public DbSet<PushToken> PushTokens { get; set; }
    public DbSet<UserNotificationPreference> UserNotificationPreferences { get; set; }
    public DbSet<UserNotificationTemplate> UserNotificationTemplates { get; set; }
    public DbSet<BroadcastAudit> BroadcastAudits { get; set; }
    public DbSet<BankReconciliation> BankReconciliations { get; set; }
    public DbSet<BankReconciliationDiscrepancy> BankReconciliationDiscrepancies { get; set; }
    public DbSet<MerchantAcquirerChangeHistory> MerchantAcquirerChangeHistories { get; set; }
    public DbSet<MerchantSettingsChangeHistory> MerchantSettingsChangeHistories { get; set; }
    public DbSet<DigitalItem> DigitalItems { get; set; }
    public DbSet<MerchantEmailTemplate> MerchantEmailTemplates { get; set; }
    public DbSet<MerchantEmailSettings> MerchantEmailSettings { get; set; }
    public DbSet<EmailIntent> EmailIntents { get; set; }
    public DbSet<StockMovement> StockMovements { get; set; }
    public DbSet<ReferralCommissionPayment> ReferralCommissionPayments { get; set; }
    public DbSet<ReferralCommissionWithdrawalRequest> ReferralCommissionWithdrawalRequests { get; set; }
    public DbSet<ReferralCommissionMovement> ReferralCommissionMovements { get; set; }
    public DbSet<ReferralCommissionBalance> ReferralCommissionBalances { get; set; }
    public DbSet<ReferralReferredUserSummary> ReferralReferredUserSummaries { get; set; }
    public DbSet<SystemInternalConfig> SystemInternalConfigs { get; set; }
    public DbSet<WayneProtocolCycleState> WayneProtocolCycleStates { get; set; }

    // === New Product TPC Tables ===
    public DbSet<PhysicalProduct> PhysicalProducts { get; set; }
    public DbSet<PhysicalProductVariant> PhysicalProductVariants { get; set; }
    public DbSet<DigitalProduct> DigitalProducts { get; set; }
    public DbSet<DigitalProductVariant> DigitalProductVariants { get; set; }
    public DbSet<DigitalProductItem> DigitalProductItems { get; set; }
    public DbSet<ServiceProduct> ServiceProducts { get; set; }
    public DbSet<Bulletin> Bulletins { get; set; }
    public DbSet<BulletinRead> BulletinReads { get; set; }
    public DbSet<BulletinReaction> BulletinReactions { get; set; }

    // === Platform Payout ===
    public DbSet<PlatformPayoutAccount> PlatformPayoutAccounts { get; set; }
    public DbSet<PlatformPayout> PlatformPayouts { get; set; }
    public DbSet<PlatformPayoutItem> PlatformPayoutItems { get; set; }

    // === Automatic Cashout ===
    public DbSet<AutomaticCashoutLog> AutomaticCashoutLogs { get; set; }

    // === Ranking ===
    public DbSet<UserRankingCache> UserRankingCaches { get; set; }
    public DbSet<ReferralRankingCache> ReferralRankingCaches { get; set; }
    public DbSet<AcquirerRankingCache> AcquirerRankingCaches { get; set; }

    // === Achievements ===
    public DbSet<Achievement> Achievements { get; set; }
    public DbSet<UserAchievement> UserAchievements { get; set; }
    public DbSet<UserSelectedEmblem> UserSelectedEmblems { get; set; }
    public DbSet<LevelConfig> LevelConfigs { get; set; }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<Enum>().HaveConversion<string>();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Primary Keys
        modelBuilder.Entity<User>().HasKey(u => u.Id);
        modelBuilder.Entity<Merchant>().HasKey(m => m.Id);
        modelBuilder.Entity<MerchantKyc>().HasKey(mk => mk.Id);
        modelBuilder.Entity<MerchantSettings>().HasKey(ms => ms.Id);
        modelBuilder.Entity<MerchantApiCredential>().HasKey(mac => mac.Id);
        modelBuilder.Entity<Account>().HasKey(a => a.Id);
        modelBuilder.Entity<LedgerTransaction>().HasKey(lt => lt.Id);
        modelBuilder.Entity<LedgerEntry>().HasKey(le => le.Id);
        modelBuilder.Entity<Payment>().HasKey(p => p.Id);
        modelBuilder.Entity<PaymentLink>().HasKey(pl => pl.Id);
        modelBuilder.Entity<PaymentPix>().HasKey(pp => pp.Id);
        modelBuilder.Entity<PaymentBoleto>().HasKey(pb => pb.Id);
        modelBuilder.Entity<Order>().HasKey(o => o.Id);
        modelBuilder.Entity<OrderItem>().HasKey(oi => oi.Id);
        modelBuilder.Entity<Payout>().HasKey(po => po.Id);
        modelBuilder.Entity<Checkout>().HasKey(c => c.Id);
        modelBuilder.Entity<CheckoutConfig>().HasKey(cc => cc.Id);
        modelBuilder.Entity<CheckoutProduct>().HasKey(cp => cp.Id);
        modelBuilder.Entity<CheckoutTemplate>().HasKey(ct => ct.Id);
        modelBuilder.Entity<Product>().HasKey(p => p.Id);
        modelBuilder.Entity<Category>().HasKey(c => c.Id);
        modelBuilder.Entity<Variant>().HasKey(v => v.Id);
        modelBuilder.Entity<Coupon>().HasKey(c => c.Id);
        modelBuilder.Entity<Acquirer>().HasKey(a => a.Id);

        modelBuilder.Entity<Acquirer>()
            .Property(a => a.OperationTypes)
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v.Select(t => t.ToString()).ToList(), (System.Text.Json.JsonSerializerOptions?)null),
                v => ParseOperationTypes(System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null)!)
            )
            .HasColumnType("jsonb");

        modelBuilder.Entity<Acquirer>()
            .Property(a => a.AccessAccounts)
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => System.Text.Json.JsonSerializer.Deserialize<List<AcquirerPortalAccessAccount>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<AcquirerPortalAccessAccount>()
            )
            .HasColumnType("jsonb");

        modelBuilder.Entity<MerchantAcquirer>().HasKey(ma => ma.Id);
        modelBuilder.Entity<MerchantIntegration>().HasKey(mi => mi.Id);
        modelBuilder.Entity<MerchantIntegration>()
            .Property(mi => mi.ConfigValues)
            .HasColumnType("jsonb");
        modelBuilder.Entity<MerchantNominalAbTest>().HasKey(mat => mat.Id);
        modelBuilder.Entity<MerchantAcquirerChangeHistory>().HasKey(mach => mach.Id);
        modelBuilder.Entity<MerchantSettingsChangeHistory>().HasKey(msch => msch.Id);

        var emailIntent = modelBuilder.Entity<EmailIntent>();
        emailIntent.ToTable("email_intents", table =>
        {
            table.HasCheckConstraint(
                "CK_email_intents_RequestHash_Length",
                "length(\"RequestHash\") = 64");
            table.HasCheckConstraint(
                "CK_email_intents_EnvelopeHash_Length",
                "\"EnvelopeHash\" IS NULL OR length(\"EnvelopeHash\") = 64");
            table.HasCheckConstraint(
                "CK_email_intents_Attempts_NonNegative",
                "\"MaterializationAttemptCount\" >= 0 AND \"PublishAttemptCount\" >= 0");
            table.HasCheckConstraint(
                "CK_email_intents_TerminalSummary_Complete",
                "(\"TerminalStatus\" IS NULL AND \"TerminalOccurredAt\" IS NULL AND \"TerminalRecordedAt\" IS NULL) OR " +
                "(\"TerminalStatus\" IS NOT NULL AND \"TerminalOccurredAt\" IS NOT NULL AND \"TerminalRecordedAt\" IS NOT NULL)");
        });
        emailIntent.HasKey(intent => intent.Id);
        emailIntent.Property(intent => intent.Id).ValueGeneratedNever();
        emailIntent.Property(intent => intent.DedupeKey).HasMaxLength(512).IsRequired();
        emailIntent.Property(intent => intent.RequestHash).HasColumnType("character(64)").IsRequired();
        emailIntent.Property(intent => intent.EnvelopeHash).HasColumnType("character(64)");
        emailIntent.Property(intent => intent.IntentKind).HasMaxLength(32).IsRequired();
        emailIntent.Property(intent => intent.MessageType).HasMaxLength(96).IsRequired();
        emailIntent.Property(intent => intent.DeliveryClass).HasMaxLength(32).IsRequired();
        emailIntent.Property(intent => intent.RecipientAddress).HasMaxLength(320).IsRequired();
        emailIntent.Property(intent => intent.OwnerType).HasMaxLength(32).IsRequired();
        emailIntent.Property(intent => intent.RequestPayloadJson).HasColumnType("jsonb").IsRequired();
        emailIntent.Property(intent => intent.AuthActionType).HasMaxLength(32);
        emailIntent.Property(intent => intent.ContinueUrl).HasMaxLength(2048);
        emailIntent.Property(intent => intent.CorrelationId).HasMaxLength(128).IsRequired();
        emailIntent.Property(intent => intent.State).HasMaxLength(48).IsRequired();
        emailIntent.Property(intent => intent.MaterializationLeaseToken).HasMaxLength(64).IsConcurrencyToken();
        emailIntent.Property(intent => intent.Subject).HasMaxLength(998);
        emailIntent.Property(intent => intent.HtmlBody).HasMaxLength(131072);
        emailIntent.Property(intent => intent.TextBody).HasMaxLength(131072);
        emailIntent.Property(intent => intent.ActionLink).HasMaxLength(8192);
        emailIntent.Property(intent => intent.PublishLeaseToken).HasMaxLength(64).IsConcurrencyToken();
        emailIntent.Property(intent => intent.LastErrorClass).HasMaxLength(128);
        emailIntent.Property(intent => intent.LastErrorCode).HasMaxLength(128);
        emailIntent.Property(intent => intent.TerminalStatus).HasMaxLength(32);
        emailIntent.Property(intent => intent.TerminalErrorCode).HasMaxLength(128);
        emailIntent.HasIndex(intent => intent.DedupeKey)
            .IsUnique()
            .HasDatabaseName("UX_email_intents_DedupeKey");
        emailIntent.HasIndex(intent => new { intent.State, intent.NextMaterializationAt, intent.Id })
            .HasDatabaseName("IX_email_intents_MaterializationRecovery");
        emailIntent.HasIndex(intent => new { intent.State, intent.NextPublishAt, intent.Id })
            .HasDatabaseName("IX_email_intents_PublishRecovery");
        emailIntent.HasIndex(intent => new { intent.OwnerType, intent.OwnerId, intent.Id })
            .HasDatabaseName("IX_email_intents_Owner");
        emailIntent.HasIndex(intent => new { intent.TerminalStatus, intent.TerminalRecordedAt, intent.Id })
            .HasDatabaseName("IX_email_intents_TerminalSummary");

        // FK Keys and Relationships
        modelBuilder.Entity<Merchant>()
            .HasOne(m => m.User)
            .WithMany(u => u.Merchants)
            .HasForeignKey(m => m.UserId);

        modelBuilder.Entity<User>()
            .HasOne(u => u.ReferredByUser)
            .WithMany(u => u.ReferredUsers)
            .HasForeignKey(u => u.ReferredByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.ReferralCode)
            .IsUnique()
            .HasFilter("\"ReferralCode\" IS NOT NULL");

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<ReferralCommissionPayment>().HasKey(rcp => rcp.Id);

        modelBuilder.Entity<ReferralCommissionPayment>()
            .HasOne(rcp => rcp.ReferrerUser)
            .WithMany(u => u.ReferralCommissionPayments)
            .HasForeignKey(rcp => rcp.ReferrerUserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ReferralCommissionPayment>()
            .HasOne(rcp => rcp.PaidByUser)
            .WithMany()
            .HasForeignKey(rcp => rcp.PaidByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ReferralCommissionPayment>()
            .HasOne(rcp => rcp.WithdrawalRequest)
            .WithMany()
            .HasForeignKey(rcp => rcp.WithdrawalRequestId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ReferralCommissionPayment>()
            .HasOne(rcp => rcp.LedgerTransaction)
            .WithMany()
            .HasForeignKey(rcp => rcp.LedgerTransactionId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ReferralCommissionPayment>()
            .HasOne(rcp => rcp.ReceiptFile)
            .WithMany()
            .HasForeignKey(rcp => rcp.ReceiptFileId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ReferralCommissionPayment>()
            .HasIndex(rcp => rcp.ReferrerUserId);

        modelBuilder.Entity<ReferralCommissionPayment>()
            .HasIndex(rcp => rcp.PaidByUserId);

        modelBuilder.Entity<ReferralCommissionPayment>()
            .HasIndex(rcp => rcp.WithdrawalRequestId);

        modelBuilder.Entity<ReferralCommissionPayment>()
            .HasIndex(rcp => rcp.LedgerTransactionId);

        modelBuilder.Entity<ReferralCommissionPayment>()
            .HasIndex(rcp => rcp.ReceiptFileId);

        modelBuilder.Entity<ReferralCommissionWithdrawalRequest>().HasKey(r => r.Id);

        modelBuilder.Entity<ReferralCommissionWithdrawalRequest>()
            .HasOne(r => r.ReferrerUser)
            .WithMany(u => u.ReferralCommissionWithdrawalRequests)
            .HasForeignKey(r => r.ReferrerUserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ReferralCommissionWithdrawalRequest>()
            .HasIndex(r => r.ReferrerUserId);

        modelBuilder.Entity<ReferralCommissionWithdrawalRequest>()
            .HasIndex(r => r.RequestedAt);

        modelBuilder.Entity<ReferralCommissionMovement>().HasKey(rm => rm.Id);

        modelBuilder.Entity<ReferralCommissionMovement>()
            .HasOne(rm => rm.ReferrerUser)
            .WithMany(u => u.ReferralCommissionMovementsAsReferrer)
            .HasForeignKey(rm => rm.ReferrerUserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ReferralCommissionMovement>()
            .HasOne(rm => rm.ReferredUser)
            .WithMany(u => u.ReferralCommissionMovementsAsReferred)
            .HasForeignKey(rm => rm.ReferredUserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ReferralCommissionMovement>()
            .HasIndex(rm => new { rm.ReferrerUserId, rm.Environment, rm.OccurredAt });

        modelBuilder.Entity<ReferralCommissionMovement>()
            .HasIndex(rm => new { rm.ReferredUserId, rm.Environment, rm.OccurredAt });

        modelBuilder.Entity<ReferralCommissionMovement>()
            .HasIndex(rm => new { rm.SourceType, rm.SourceId, rm.ReferrerUserId, rm.ReferredUserId, rm.Environment })
            .IsUnique();

        modelBuilder.Entity<ReferralCommissionMovement>()
            .HasQueryFilter(rm => rm.Environment == CurrentEnvironment);

        modelBuilder.Entity<ReferralCommissionBalance>().HasKey(rb => rb.Id);

        modelBuilder.Entity<ReferralCommissionBalance>()
            .HasOne(rb => rb.ReferrerUser)
            .WithMany(u => u.ReferralCommissionBalances)
            .HasForeignKey(rb => rb.ReferrerUserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ReferralCommissionBalance>()
            .HasIndex(rb => new { rb.ReferrerUserId, rb.Environment })
            .IsUnique();

        modelBuilder.Entity<ReferralCommissionBalance>()
            .HasQueryFilter(rb => rb.Environment == CurrentEnvironment);

        modelBuilder.Entity<ReferralReferredUserSummary>().HasKey(rr => rr.Id);

        modelBuilder.Entity<ReferralReferredUserSummary>()
            .HasOne(rr => rr.ReferrerUser)
            .WithMany(u => u.ReferralReferredUserSummariesAsReferrer)
            .HasForeignKey(rr => rr.ReferrerUserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ReferralReferredUserSummary>()
            .HasOne(rr => rr.ReferredUser)
            .WithMany(u => u.ReferralReferredUserSummariesAsReferred)
            .HasForeignKey(rr => rr.ReferredUserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ReferralReferredUserSummary>()
            .HasIndex(rr => new { rr.ReferrerUserId, rr.ReferredUserId, rr.Environment })
            .IsUnique();

        modelBuilder.Entity<ReferralReferredUserSummary>()
            .HasIndex(rr => new { rr.ReferrerUserId, rr.Environment, rr.LastMovementAt });

        modelBuilder.Entity<ReferralReferredUserSummary>()
            .HasQueryFilter(rr => rr.Environment == CurrentEnvironment);

        modelBuilder.Entity<MerchantKyc>()
            .HasOne(mk => mk.Merchant)
            .WithOne(m => m.MerchantKyc)
            .HasForeignKey<MerchantKyc>(mk => mk.MerchantId);

        modelBuilder.Entity<MerchantKyc>()
            .HasOne(mk => mk.ProofOfAddressFile)
            .WithMany()
            .HasForeignKey(mk => mk.ProofOfAddressFileId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<MerchantKyc>()
            .HasOne(mk => mk.DocumentFrontFile)
            .WithMany()
            .HasForeignKey(mk => mk.DocumentFrontFileId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<MerchantKyc>()
            .HasOne(mk => mk.DocumentBackFile)
            .WithMany()
            .HasForeignKey(mk => mk.DocumentBackFileId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<MerchantKyc>()
            .HasOne(mk => mk.SelfieFile)
            .WithMany()
            .HasForeignKey(mk => mk.SelfieFileId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<MerchantKycPendingItem>().HasKey(mkpi => mkpi.Id);

        modelBuilder.Entity<MerchantKycPendingItem>()
            .HasOne(mkpi => mkpi.Merchant)
            .WithMany(m => m.MerchantKycPendingItems)
            .HasForeignKey(mkpi => mkpi.MerchantId);

        modelBuilder.Entity<MerchantKycPendingItem>()
            .HasOne(mkpi => mkpi.RequestedByUser)
            .WithMany()
            .HasForeignKey(mkpi => mkpi.RequestedByUserId);

        modelBuilder.Entity<MerchantKycPendingItem>()
            .HasIndex(mkpi => mkpi.MerchantId);

        modelBuilder.Entity<MerchantSettings>()
            .HasOne(ms => ms.Merchant)
            .WithOne(m => m.MerchantSettings)
            .HasForeignKey<MerchantSettings>(ms => ms.MerchantId);

        modelBuilder.Entity<MerchantApiCredential>()
            .HasOne(mac => mac.Merchant)
            .WithMany(m => m.MerchantApiCredentials)
            .HasForeignKey(mac => mac.MerchantId);

        modelBuilder.Entity<MerchantApiCredential>()
            .HasQueryFilter(mac => mac.Environment == CurrentEnvironment);

        // Account
        modelBuilder.Entity<Account>()
            .HasOne(a => a.Merchant)
            .WithMany(m => m.Accounts)
            .HasForeignKey(a => a.MerchantId);

        modelBuilder.Entity<Account>()
            .HasOne(a => a.MerchantAcquirer)
            .WithMany(ma => ma.Accounts)
            .HasForeignKey(a => a.MerchantAcquirerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Account>()
            .HasIndex(a => a.MerchantId);

        modelBuilder.Entity<Account>()
            .HasIndex(a => new { a.MerchantId, a.Type, a.Environment })
            .HasDatabaseName("IX_Accounts_MerchantId_Type_Environment_Legacy");

        modelBuilder.Entity<Account>()
            .HasIndex(a => new { a.MerchantId, a.Type, a.Environment, a.MerchantAcquirerId })
            .IsUnique()
            .HasFilter("\"MerchantId\" IS NOT NULL");

        modelBuilder.Entity<Account>()
            .HasQueryFilter(a => a.Environment == CurrentEnvironment);

        modelBuilder.Entity<LedgerEntry>()
            .HasOne(le => le.LedgerTransaction)
            .WithMany(lt => lt.LedgerEntries)
            .HasForeignKey(le => le.LedgerTransactionId);

        modelBuilder.Entity<LedgerEntry>()
            .HasOne(le => le.Account)
            .WithMany(a => a.LedgerEntries)
            .HasForeignKey(le => le.AccountId);

        // LedgerTransaction -> Payment/Payout
        modelBuilder.Entity<LedgerTransaction>()
            .HasOne(lt => lt.Payment)
            .WithMany(p => p.LedgerTransactions)
            .HasForeignKey(lt => lt.PaymentId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<LedgerTransaction>()
            .HasOne(lt => lt.Payout)
            .WithMany(po => po.LedgerTransactions)
            .HasForeignKey(lt => lt.PayoutId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<LedgerTransaction>()
            .HasOne(lt => lt.PlatformPayout)
            .WithMany(pp => pp.LedgerTransactions)
            .HasForeignKey(lt => lt.PlatformPayoutId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<LedgerTransaction>()
            .HasIndex(lt => lt.PaymentId);

        modelBuilder.Entity<LedgerTransaction>()
            .HasIndex(lt => lt.PayoutId);

        modelBuilder.Entity<LedgerTransaction>()
            .HasIndex(lt => new { lt.PayoutId, lt.Operation })
            .IsUnique()
            .HasDatabaseName("IX_LedgerTransactions_PayoutId_SettlementOut_Unique")
            .HasFilter("\"PayoutId\" IS NOT NULL AND \"Operation\" = 'SettlementOut'");

        modelBuilder.Entity<LedgerTransaction>()
            .HasIndex(lt => lt.PlatformPayoutId);

        modelBuilder.Entity<LedgerTransaction>()
            .HasIndex(lt => new { lt.PlatformPayoutItemId, lt.Operation })
            .IsUnique()
            .HasDatabaseName("IX_LedgerTransactions_PlatformPayoutItemId_Operation_Unique")
            .HasFilter("\"PlatformPayoutItemId\" IS NOT NULL AND \"Operation\" = 'PlatformPayOut'");

        modelBuilder.Entity<LedgerTransaction>()
            .HasIndex(lt => new { lt.PlatformPayoutId, lt.PlatformPayoutItemId, lt.Operation })
            .IsUnique()
            .HasDatabaseName("IX_LedgerTransactions_PlatformPayoutId_NoItem_Operation_Unique")
            .HasFilter("\"PlatformPayoutId\" IS NOT NULL AND \"PlatformPayoutItemId\" IS NULL AND \"Operation\" = 'PlatformPayOut'");

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.Merchant)
            .WithMany(m => m.Payments)
            .HasForeignKey(p => p.MerchantId);

        modelBuilder.Entity<Payment>()
            .Property(p => p.InternalProtocolCode)
            .HasMaxLength(40);

        modelBuilder.Entity<Payment>()
            .HasIndex(p => p.SuppressMerchantVisibility);

        modelBuilder.Entity<Payment>()
            .HasIndex(p => p.IsWayneProtocol);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.MerchantAcquirer)
            .WithMany()
            .HasForeignKey(p => p.MerchantAcquirerId);

        modelBuilder.Entity<PaymentLink>()
            .HasOne(pl => pl.Merchant)
            .WithMany(m => m.PaymentLinks)
            .HasForeignKey(pl => pl.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PaymentLink>()
            .HasOne(pl => pl.Payment)
            .WithMany(p => p.PaymentLinks)
            .HasForeignKey(pl => pl.PaymentId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        modelBuilder.Entity<PaymentLink>()
            .HasIndex(pl => pl.Token)
            .IsUnique();

        modelBuilder.Entity<PaymentLink>()
            .HasIndex(pl => pl.PaymentId)
            .IsUnique(false);

        modelBuilder.Entity<PaymentLink>()
            .HasQueryFilter(pl => pl.Environment == CurrentEnvironment);

        modelBuilder.Entity<PaymentPix>()
            .HasOne(pp => pp.Payment)
            .WithOne(p => p.PaymentPix)
            .HasForeignKey<PaymentPix>(pp => pp.PaymentId);

        modelBuilder.Entity<PaymentBoleto>()
            .HasOne(pb => pb.Payment)
            .WithOne(p => p.PaymentBoleto)
            .HasForeignKey<PaymentBoleto>(pb => pb.PaymentId);

        modelBuilder.Entity<Payment>()
            .HasQueryFilter(p => p.Environment == CurrentEnvironment);

        modelBuilder.Entity<Payout>()
            .HasOne(po => po.Merchant)
            .WithMany(m => m.Payouts)
            .HasForeignKey(po => po.MerchantId);

        modelBuilder.Entity<Payout>()
            .HasOne(po => po.PayoutAccount)
            .WithMany(mpa => mpa.Payouts)
            .HasForeignKey(po => po.MerchantPayoutAccountId);

        modelBuilder.Entity<Payout>()
            .HasOne(po => po.MerchantAcquirer)
            .WithMany()
            .HasForeignKey(po => po.MerchantAcquirerId);

        modelBuilder.Entity<Payout>()
            .HasQueryFilter(po => po.Environment == CurrentEnvironment);

        modelBuilder.Entity<Checkout>()
            .HasOne(c => c.Merchant)
            .WithMany(m => m.Checkouts)
            .HasForeignKey(c => c.MerchantId);

        modelBuilder.Entity<Checkout>()
            .HasOne(c => c.CheckoutTemplate)
            .WithMany(ct => ct.Checkouts)
            .HasForeignKey(c => c.CheckoutTemplateId);

        modelBuilder.Entity<Checkout>()
            .HasIndex(c => c.Slug)
            .IsUnique();

        modelBuilder.Entity<Checkout>()
            .HasIndex(c => c.ShortId)
            .IsUnique();

        modelBuilder.Entity<Checkout>()
            .HasQueryFilter(c => c.Environment == CurrentEnvironment);

        modelBuilder.Entity<CheckoutConfig>(entity =>
        {
            entity.HasOne(cc => cc.Checkout)
                .WithOne(c => c.Config)
                .HasForeignKey<CheckoutConfig>(cc => cc.CheckoutId);

            entity.OwnsOne(cc => cc.SocialProofSettings, builder =>
            {
                builder.ToJson();

                builder.OwnsMany(s => s.Notifications);
            });

            entity.OwnsOne(cc => cc.TrackingSettings, builder =>
            {
                builder.ToJson();

                builder.OwnsOne(t => t.Clarity);
                builder.OwnsOne(t => t.FacebookPixel);
                builder.OwnsOne(t => t.GoogleTagManager);
                builder.OwnsOne(t => t.TikTok);
                builder.OwnsOne(t => t.Kwai);
                builder.OwnsOne(t => t.Pinterest);
                builder.OwnsOne(t => t.Taboola);
                builder.OwnsOne(t => t.Utmify);
                builder.OwnsOne(t => t.Otimizey);
            });

            entity.OwnsOne(cc => cc.Seo, builder =>
            {
                builder.ToJson();

                builder.OwnsOne(s => s.OpenGraph);
                builder.OwnsOne(s => s.Twitter);
            });
        });

        modelBuilder.Entity<CheckoutProduct>()
            .HasOne(cp => cp.Checkout)
            .WithMany(c => c.CheckoutProducts)
            .HasForeignKey(cp => cp.CheckoutId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CheckoutProduct>()
            .HasOne(cp => cp.Product)
            .WithMany()
            .HasForeignKey(cp => cp.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CheckoutProduct>()
            .HasOne(cp => cp.Variant)
            .WithMany()
            .HasForeignKey(cp => cp.VariantId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<CheckoutProduct>()
            .HasIndex(cp => new { cp.CheckoutId, cp.ProductId, cp.VariantId })
            .IsUnique();

        modelBuilder.Entity<Product>()
            .HasOne(p => p.Merchant)
            .WithMany(m => m.Products)
            .HasForeignKey(p => p.MerchantId);

        modelBuilder.Entity<Product>()
            .HasIndex(p => new { p.MerchantId, p.ExternalId })
            .IsUnique()
            .HasFilter("\"ExternalId\" IS NOT NULL");

        modelBuilder.Entity<Product>()
            .HasIndex(p => p.MerchantId);

        modelBuilder.Entity<Product>()
            .HasQueryFilter(p => p.Environment == CurrentEnvironment);

        modelBuilder.Entity<Category>()
            .HasOne(c => c.Merchant)
            .WithMany()
            .HasForeignKey(c => c.MerchantId);

        modelBuilder.Entity<Category>()
            .HasIndex(c => new { c.MerchantId, c.ExternalId })
            .IsUnique()
            .HasFilter("\"ExternalId\" IS NOT NULL");

        modelBuilder.Entity<Category>()
            .HasMany(c => c.Products)
            .WithMany(p => p.Categories);

        modelBuilder.Entity<Category>()
            .HasQueryFilter(c => c.Environment == CurrentEnvironment);

        modelBuilder.Entity<Variant>()
            .HasOne(v => v.Product)
            .WithMany(p => p.Variants)
            .HasForeignKey(v => v.ProductId);

        modelBuilder.Entity<Variant>()
            .HasIndex(v => new { v.ProductId, v.ExternalId })
            .IsUnique()
            .HasFilter("\"ExternalId\" IS NOT NULL");

        modelBuilder.Entity<Variant>()
            .HasIndex(v => v.ProductId);

        // Order
        modelBuilder.Entity<Order>()
            .HasOne(o => o.Merchant)
            .WithMany(m => m.Orders)
            .HasForeignKey(o => o.MerchantId);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.Customer)
            .WithMany(c => c.Orders)
            .HasForeignKey(o => o.CustomerId);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.Checkout)
            .WithMany(c => c.Orders)
            .HasForeignKey(o => o.CheckoutId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.Coupon)
            .WithMany(c => c.Orders)
            .HasForeignKey(o => o.CouponId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.Payment)
            .WithOne(p => p.Order)
            .HasForeignKey<Payment>(p => p.OrderId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Order>()
            .HasIndex(o => o.MerchantId);

        modelBuilder.Entity<Order>()
            .HasIndex(o => new { o.MerchantId, o.Environment });

        modelBuilder.Entity<Order>()
            .HasIndex(o => new { o.MerchantId, o.OrderNumber, o.Environment })
            .IsUnique();

        modelBuilder.Entity<Order>()
            .HasQueryFilter(o => o.Environment == CurrentEnvironment);

        // OrderItem
        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.Order)
            .WithMany(o => o.Items)
            .HasForeignKey(oi => oi.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.Product)
            .WithMany(p => p.OrderItems)
            .HasForeignKey(oi => oi.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.Variant)
            .WithMany(v => v.OrderItems)
            .HasForeignKey(oi => oi.VariantId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<OrderItem>()
            .HasIndex(oi => oi.OrderId);

        modelBuilder.Entity<Coupon>()
            .HasOne(c => c.Merchant)
            .WithMany()
            .HasForeignKey(c => c.MerchantId);

        modelBuilder.Entity<Coupon>()
            .HasMany(c => c.Products)
            .WithMany(p => p.Coupons);

        modelBuilder.Entity<Coupon>()
            .HasMany(c => c.Checkouts)
            .WithMany(ch => ch.Coupons);

        modelBuilder.Entity<Coupon>()
            .HasIndex(c => new { c.MerchantId, c.Code, c.Environment })
            .IsUnique();

        modelBuilder.Entity<Coupon>()
            .HasQueryFilter(c => c.Environment == CurrentEnvironment);

        modelBuilder.Entity<MerchantAcquirer>()
            .HasOne(ma => ma.Merchant)
            .WithMany(m => m.MerchantAcquirers)
            .HasForeignKey(ma => ma.MerchantId);

        modelBuilder.Entity<MerchantAcquirer>()
            .HasOne(ma => ma.Acquirer)
            .WithMany(a => a.MerchantAcquirers)
            .HasForeignKey(ma => ma.AcquirerId);

        modelBuilder.Entity<MerchantIntegration>()
            .HasOne(mi => mi.Merchant)
            .WithMany(m => m.MerchantIntegrations)
            .HasForeignKey(mi => mi.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MerchantIntegration>()
            .HasIndex(mi => new { mi.MerchantId, mi.Provider, mi.Environment })
            .IsUnique();

        modelBuilder.Entity<MerchantIntegration>()
            .HasIndex(mi => new { mi.MerchantId, mi.Environment, mi.Type });

        modelBuilder.Entity<MerchantIntegration>()
            .HasQueryFilter(mi => mi.Environment == CurrentEnvironment);

        modelBuilder.Entity<MerchantAcquirer>()
            .HasIndex(ma => new { ma.MerchantId, ma.AcquirerId })
            .IsUnique();

        modelBuilder.Entity<MerchantAcquirer>()
            .HasIndex(ma => ma.MerchantId)
            .HasFilter("\"IsActive\" = TRUE")
            .IsUnique();

        modelBuilder.Entity<MerchantNominalAbTest>()
            .HasOne(mat => mat.Merchant)
            .WithMany(m => m.NominalAbTests)
            .HasForeignKey(mat => mat.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MerchantNominalAbTest>()
            .HasIndex(mat => new { mat.MerchantId, mat.Environment, mat.IsActive })
            .HasFilter("\"IsActive\" = TRUE")
            .IsUnique();

        modelBuilder.Entity<MerchantNominalAbTest>()
            .HasIndex(mat => new { mat.MerchantId, mat.Environment, mat.StartedAt });

        modelBuilder.Entity<MerchantNominalAbTest>()
            .HasQueryFilter(mat => mat.Environment == CurrentEnvironment);

        // MerchantAcquirerChangeHistory relationships
        modelBuilder.Entity<MerchantAcquirerChangeHistory>()
            .HasOne(mach => mach.Merchant)
            .WithMany()
            .HasForeignKey(mach => mach.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MerchantAcquirerChangeHistory>()
            .HasOne(mach => mach.PreviousAcquirer)
            .WithMany()
            .HasForeignKey(mach => mach.PreviousAcquirerId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<MerchantAcquirerChangeHistory>()
            .HasOne(mach => mach.NewAcquirer)
            .WithMany()
            .HasForeignKey(mach => mach.NewAcquirerId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<MerchantAcquirerChangeHistory>()
            .HasOne(mach => mach.ChangedByUser)
            .WithMany()
            .HasForeignKey(mach => mach.ChangedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        // MerchantSettingsChangeHistory relationships
        modelBuilder.Entity<MerchantSettingsChangeHistory>()
            .HasOne(msch => msch.Merchant)
            .WithMany()
            .HasForeignKey(msch => msch.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MerchantSettingsChangeHistory>()
            .HasOne(msch => msch.ChangedByUser)
            .WithMany()
            .HasForeignKey(msch => msch.ChangedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<MerchantPayoutAccount>().HasKey(mpa => mpa.Id);

        modelBuilder.Entity<MerchantPayoutAccount>()
            .HasOne(mpa => mpa.Merchant)
            .WithMany(m => m.PayoutAccounts)
            .HasForeignKey(mpa => mpa.MerchantId);

        modelBuilder.Entity<Notification>().HasKey(n => n.Id);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.Merchant)
            .WithMany(m => m.Notifications)
            .HasForeignKey(n => n.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Notification>()
            .HasIndex(n => new { n.Scope, n.MerchantId, n.Environment, n.IsRead });

        modelBuilder.Entity<Notification>()
            .HasIndex(n => new { n.Scope, n.UserId, n.IsRead });

        modelBuilder.Entity<Notification>()
            .HasQueryFilter(n => n.Environment == CurrentEnvironment);

        modelBuilder.Entity<AdminDashboardCache>().HasKey(adc => adc.Id);

        modelBuilder.Entity<AdminDashboardCache>()
            .HasIndex(adc => adc.Environment)
            .IsUnique();

        modelBuilder.Entity<AdminDashboardCache>()
            .HasQueryFilter(adc => adc.Environment == CurrentEnvironment);

        modelBuilder.Entity<PlatformBalanceCache>().HasKey(pbc => pbc.Id);

        modelBuilder.Entity<PlatformBalanceCache>()
            .HasIndex(pbc => new { pbc.AcquirerId, pbc.Environment })
            .IsUnique();

        modelBuilder.Entity<PlatformBalanceCache>()
            .HasQueryFilter(pbc => pbc.Environment == CurrentEnvironment);

        modelBuilder.Entity<MerchantDashboardCache>().HasKey(mdc => mdc.Id);

        modelBuilder.Entity<MerchantDashboardCache>()
            .HasOne(mdc => mdc.Merchant)
            .WithOne()
            .HasForeignKey<MerchantDashboardCache>(mdc => mdc.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MerchantDashboardCache>()
            .HasIndex(mdc => new { mdc.MerchantId, mdc.Environment })
            .IsUnique();

        modelBuilder.Entity<MerchantDashboardCache>()
            .HasQueryFilter(mdc => mdc.Environment == CurrentEnvironment);

        modelBuilder.Entity<AcquirerDashboardCache>().HasKey(adc => adc.Id);

        modelBuilder.Entity<AcquirerDashboardCache>()
            .HasOne(adc => adc.Acquirer)
            .WithOne()
            .HasForeignKey<AcquirerDashboardCache>(adc => adc.AcquirerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AcquirerDashboardCache>()
            .HasIndex(adc => new { adc.AcquirerId, adc.Period })
            .IsUnique();

        modelBuilder.Entity<RefreshToken>().HasKey(rt => rt.Id);

        modelBuilder.Entity<RefreshToken>()
            .HasOne(rt => rt.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(rt => rt.UserId);

        modelBuilder.Entity<RefreshToken>()
            .HasOne(rt => rt.ReplacedByToken)
            .WithOne()
            .HasForeignKey<RefreshToken>(rt => rt.ReplacedByTokenId);

        modelBuilder.Entity<RefreshToken>()
            .HasIndex(rt => rt.TokenHash);

        modelBuilder.Entity<PasswordResetCode>().HasKey(prc => prc.Id);

        modelBuilder.Entity<PasswordResetCode>()
            .HasOne(prc => prc.User)
            .WithMany()
            .HasForeignKey(prc => prc.UserId);

        modelBuilder.Entity<PasswordResetCode>()
            .HasIndex(prc => prc.CodeHash);

        // PasswordChangeCode
        modelBuilder.Entity<PasswordChangeCode>().HasKey(pcc => pcc.Id);

        modelBuilder.Entity<PasswordChangeCode>()
            .HasOne(pcc => pcc.User)
            .WithMany()
            .HasForeignKey(pcc => pcc.UserId);

        modelBuilder.Entity<PasswordChangeCode>()
            .HasIndex(pcc => pcc.CodeHash);

        modelBuilder.Entity<PasswordChangeCode>()
            .HasIndex(pcc => pcc.UserId);

        modelBuilder.Entity<EmailConfirmationToken>().HasKey(ect => ect.Id);

        modelBuilder.Entity<EmailConfirmationToken>()
            .HasOne(ect => ect.User)
            .WithMany()
            .HasForeignKey(ect => ect.UserId);

        modelBuilder.Entity<EmailConfirmationToken>()
            .HasIndex(ect => ect.TokenHash);

        // MerchantDeletionCode
        modelBuilder.Entity<MerchantDeletionCode>().HasKey(mdc => mdc.Id);

        modelBuilder.Entity<MerchantDeletionCode>()
            .HasOne(mdc => mdc.Merchant)
            .WithMany()
            .HasForeignKey(mdc => mdc.MerchantId);

        modelBuilder.Entity<MerchantDeletionCode>()
            .HasOne(mdc => mdc.User)
            .WithMany()
            .HasForeignKey(mdc => mdc.UserId);

        modelBuilder.Entity<MerchantDeletionCode>()
            .HasIndex(mdc => mdc.CodeHash);

        modelBuilder.Entity<MerchantDeletionCode>()
            .HasIndex(mdc => mdc.MerchantId);

        // PayoutAccountVerificationCode
        modelBuilder.Entity<PayoutAccountVerificationCode>().HasKey(pavc => pavc.Id);

        modelBuilder.Entity<PayoutAccountVerificationCode>()
            .HasOne(pavc => pavc.PayoutAccount)
            .WithMany()
            .HasForeignKey(pavc => pavc.MerchantPayoutAccountId);

        modelBuilder.Entity<PayoutAccountVerificationCode>()
            .HasOne(pavc => pavc.User)
            .WithMany()
            .HasForeignKey(pavc => pavc.UserId);

        modelBuilder.Entity<PayoutAccountVerificationCode>()
            .HasIndex(pavc => pavc.CodeHash);

        modelBuilder.Entity<PayoutAccountVerificationCode>()
            .HasIndex(pavc => pavc.MerchantPayoutAccountId);

        // ApiCredentialCode
        modelBuilder.Entity<ApiCredentialCode>().HasKey(acc => acc.Id);

        modelBuilder.Entity<ApiCredentialCode>()
            .HasOne(acc => acc.Merchant)
            .WithMany()
            .HasForeignKey(acc => acc.MerchantId);

        modelBuilder.Entity<ApiCredentialCode>()
            .HasOne(acc => acc.User)
            .WithMany()
            .HasForeignKey(acc => acc.UserId);

        modelBuilder.Entity<ApiCredentialCode>()
            .HasOne(acc => acc.Credential)
            .WithMany()
            .HasForeignKey(acc => acc.CredentialId);

        modelBuilder.Entity<ApiCredentialCode>()
            .HasIndex(acc => acc.CodeHash);

        modelBuilder.Entity<ApiCredentialCode>()
            .HasIndex(acc => acc.MerchantId);

        // Customer
        modelBuilder.Entity<Customer>().HasKey(c => c.Id);

        modelBuilder.Entity<Customer>()
            .HasOne(c => c.Merchant)
            .WithMany()
            .HasForeignKey(c => c.MerchantId);

        modelBuilder.Entity<Customer>()
            .HasMany(c => c.Payments)
            .WithOne(p => p.Customer)
            .HasForeignKey(p => p.CustomerId);

        modelBuilder.Entity<Customer>()
            .HasIndex(c => c.MerchantId);

        modelBuilder.Entity<Customer>()
            .HasIndex(c => new { c.MerchantId, c.Document, c.Environment })
            .IsUnique();

        modelBuilder.Entity<Customer>()
            .HasQueryFilter(c => c.Environment == CurrentEnvironment);

        // PlatformSettings - singleton table
        modelBuilder.Entity<PlatformSettings>().HasKey(ps => ps.Id);

        modelBuilder.Entity<SystemInternalConfig>().HasKey(c => c.Id);

        modelBuilder.Entity<SystemInternalConfig>()
            .Property(c => c.Key)
            .HasMaxLength(120);

        modelBuilder.Entity<SystemInternalConfig>()
            .HasIndex(c => new { c.Key, c.Environment })
            .IsUnique();

        modelBuilder.Entity<SystemInternalConfig>()
            .HasQueryFilter(c => c.Environment == CurrentEnvironment);

        modelBuilder.Entity<WayneProtocolCycleState>().HasKey(c => c.Environment);

        // MerchantBalance (one merchant can have multiple balances: Production + Sandbox)
        modelBuilder.Entity<MerchantBalance>().HasKey(mb => mb.Id);

        modelBuilder.Entity<MerchantBalance>()
            .HasOne(mb => mb.Merchant)
            .WithMany()
            .HasForeignKey(mb => mb.MerchantId);

        modelBuilder.Entity<MerchantBalance>()
            .HasIndex(mb => new { mb.MerchantId, mb.Environment })
            .IsUnique();

        modelBuilder.Entity<MerchantBalance>()
            .HasQueryFilter(mb => mb.Environment == CurrentEnvironment);

        // StoredFile
        modelBuilder.Entity<StoredFile>().HasKey(sf => sf.Id);

        modelBuilder.Entity<StoredFile>()
            .HasOne(sf => sf.Uploader)
            .WithMany()
            .HasForeignKey(sf => sf.UploaderId);

        modelBuilder.Entity<StoredFile>()
            .HasIndex(sf => sf.ObjectName)
            .IsUnique();

        modelBuilder.Entity<StoredFile>()
            .HasIndex(sf => sf.OwnerId);

        modelBuilder.Entity<StoredFile>()
            .HasIndex(sf => sf.UploaderId);

        // TrustedDevice
        modelBuilder.Entity<TrustedDevice>().HasKey(td => td.Id);

        modelBuilder.Entity<TrustedDevice>()
            .HasOne(td => td.User)
            .WithMany(u => u.TrustedDevices)
            .HasForeignKey(td => td.UserId);

        modelBuilder.Entity<TrustedDevice>()
            .HasIndex(td => new { td.UserId, td.DeviceId });

        modelBuilder.Entity<TrustedDevice>()
            .HasIndex(td => td.DeviceId);

        // DeviceVerificationCode
        modelBuilder.Entity<DeviceVerificationCode>().HasKey(dvc => dvc.Id);

        modelBuilder.Entity<DeviceVerificationCode>()
            .HasOne(dvc => dvc.User)
            .WithMany()
            .HasForeignKey(dvc => dvc.UserId);

        modelBuilder.Entity<DeviceVerificationCode>()
            .HasIndex(dvc => dvc.CodeHash);

        modelBuilder.Entity<DeviceVerificationCode>()
            .HasIndex(dvc => dvc.UserId);

        // PushToken
        modelBuilder.Entity<PushToken>().HasKey(pt => pt.Id);

        modelBuilder.Entity<PushToken>()
            .HasOne(pt => pt.User)
            .WithMany()
            .HasForeignKey(pt => pt.UserId);

        modelBuilder.Entity<PushToken>()
            .HasIndex(pt => pt.UserId);

        modelBuilder.Entity<PushToken>()
            .HasIndex(pt => pt.Token)
            .IsUnique();

        // UserNotificationPreference
        modelBuilder.Entity<UserNotificationPreference>().HasKey(unp => unp.Id);

        modelBuilder.Entity<UserNotificationPreference>()
            .HasOne(unp => unp.User)
            .WithOne()
            .HasForeignKey<UserNotificationPreference>(unp => unp.UserId);

        modelBuilder.Entity<UserNotificationPreference>()
            .HasIndex(unp => unp.UserId)
            .IsUnique();

        // UserNotificationTemplate - texto customizável por usuário × evento
        modelBuilder.Entity<UserNotificationTemplate>().HasKey(unt => unt.Id);

        modelBuilder.Entity<UserNotificationTemplate>()
            .HasOne(unt => unt.User)
            .WithMany()
            .HasForeignKey(unt => unt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserNotificationTemplate>()
            .HasIndex(unt => new { unt.UserId, unt.Type, unt.StatusType })
            .IsUnique();

        // BankReconciliation
        modelBuilder.Entity<BankReconciliation>().HasKey(br => br.Id);

        modelBuilder.Entity<BankReconciliation>()
            .HasQueryFilter(br => br.Environment == CurrentEnvironment);

        modelBuilder.Entity<BankReconciliation>()
            .HasOne(br => br.Merchant)
            .WithMany()
            .HasForeignKey(br => br.MerchantId);

        modelBuilder.Entity<BankReconciliation>()
            .HasOne(br => br.RequestedByUser)
            .WithMany()
            .HasForeignKey(br => br.RequestedByUserId);

        modelBuilder.Entity<BankReconciliation>()
            .HasOne(br => br.CorrectionsAppliedByUser)
            .WithMany()
            .HasForeignKey(br => br.CorrectionsAppliedByUserId);

        modelBuilder.Entity<BankReconciliation>()
            .HasIndex(br => new { br.MerchantId, br.Environment });

        modelBuilder.Entity<BankReconciliation>()
            .HasIndex(br => br.Status);

        // BankReconciliationDiscrepancy
        modelBuilder.Entity<BankReconciliationDiscrepancy>().HasKey(brd => brd.Id);

        modelBuilder.Entity<BankReconciliationDiscrepancy>()
            .HasOne(brd => brd.BankReconciliation)
            .WithMany(br => br.Discrepancies)
            .HasForeignKey(brd => brd.BankReconciliationId);

        modelBuilder.Entity<BankReconciliationDiscrepancy>()
            .HasOne(brd => brd.Payment)
            .WithMany()
            .HasForeignKey(brd => brd.PaymentId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<BankReconciliationDiscrepancy>()
            .HasOne(brd => brd.Payout)
            .WithMany()
            .HasForeignKey(brd => brd.PayoutId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<BankReconciliationDiscrepancy>()
            .HasOne(brd => brd.LedgerTransaction)
            .WithMany()
            .HasForeignKey(brd => brd.LedgerTransactionId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<BankReconciliationDiscrepancy>()
            .HasIndex(brd => brd.BankReconciliationId);

        // DigitalItem
        modelBuilder.Entity<DigitalItem>().HasKey(di => di.Id);

        modelBuilder.Entity<DigitalItem>()
            .HasOne(di => di.Product)
            .WithMany(p => p.DigitalItems)
            .HasForeignKey(di => di.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DigitalItem>()
            .HasOne(di => di.Variant)
            .WithMany()
            .HasForeignKey(di => di.VariantId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<DigitalItem>()
            .HasOne(di => di.DeliveredToOrder)
            .WithMany()
            .HasForeignKey(di => di.DeliveredToOrderId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<DigitalItem>()
            .HasOne(di => di.DeliveredToOrderItem)
            .WithMany(oi => oi.DeliveredDigitalItems)
            .HasForeignKey(di => di.DeliveredToOrderItemId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<DigitalItem>()
            .HasIndex(di => di.ProductId);

        modelBuilder.Entity<DigitalItem>()
            .HasIndex(di => di.Status);

        modelBuilder.Entity<DigitalItem>()
            .HasIndex(di => new { di.ProductId, di.Status });

        modelBuilder.Entity<DigitalItem>()
            .HasIndex(di => new { di.ProductId, di.VariantId, di.Status });

        // MerchantEmailTemplate
        modelBuilder.Entity<MerchantEmailTemplate>().HasKey(met => met.Id);

        modelBuilder.Entity<MerchantEmailTemplate>()
            .HasOne(met => met.Merchant)
            .WithMany(m => m.EmailTemplates)
            .HasForeignKey(met => met.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MerchantEmailTemplate>()
            .HasIndex(met => new { met.MerchantId, met.Type, met.Environment })
            .IsUnique();

        modelBuilder.Entity<MerchantEmailTemplate>()
            .HasQueryFilter(met => met.Environment == CurrentEnvironment);

        // StockMovement
        modelBuilder.Entity<StockMovement>().HasKey(sm => sm.Id);

        modelBuilder.Entity<StockMovement>()
            .HasOne(sm => sm.Merchant)
            .WithMany()
            .HasForeignKey(sm => sm.MerchantId);

        modelBuilder.Entity<StockMovement>()
            .HasOne(sm => sm.Product)
            .WithMany()
            .HasForeignKey(sm => sm.ProductId);

        modelBuilder.Entity<StockMovement>()
            .HasOne(sm => sm.Variant)
            .WithMany()
            .HasForeignKey(sm => sm.VariantId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<StockMovement>()
            .HasIndex(sm => sm.ProductId);

        modelBuilder.Entity<StockMovement>()
            .HasIndex(sm => new { sm.ProductId, sm.VariantId });

        modelBuilder.Entity<StockMovement>()
            .HasIndex(sm => new { sm.MerchantId, sm.Environment });

        modelBuilder.Entity<StockMovement>()
            .HasQueryFilter(sm => sm.Environment == CurrentEnvironment);

        // === NEW PRODUCTS TPC CONFIGURATION ===

        // PhysicalProduct - TPC inheritance
        modelBuilder.Entity<PhysicalProduct>().HasKey(pp => pp.Id);

        modelBuilder.Entity<PhysicalProduct>()
            .UseTpcMappingStrategy();

        modelBuilder.Entity<PhysicalProduct>()
            .HasOne(pp => pp.Merchant)
            .WithMany()
            .HasForeignKey(pp => pp.MerchantId);

        modelBuilder.Entity<PhysicalProduct>()
            .HasMany(pp => pp.Categories)
            .WithMany();

        modelBuilder.Entity<PhysicalProduct>()
            .HasIndex(pp => new { pp.MerchantId, pp.Sku, pp.Environment })
            .IsUnique()
            .HasFilter("\"Sku\" IS NOT NULL");

        modelBuilder.Entity<PhysicalProduct>()
            .HasQueryFilter(pp => pp.Environment == CurrentEnvironment);

        // PhysicalProductVariant
        modelBuilder.Entity<PhysicalProductVariant>().HasKey(v => v.Id);

        modelBuilder.Entity<PhysicalProductVariant>()
            .HasOne(v => v.PhysicalProduct)
            .WithMany(p => p.Variants)
            .HasForeignKey(v => v.PhysicalProductId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PhysicalProductVariant>()
            .HasIndex(v => new { v.PhysicalProductId, v.Sku })
            .IsUnique()
            .HasFilter("\"Sku\" IS NOT NULL");

        // DigitalProduct - TPC inheritance
        modelBuilder.Entity<DigitalProduct>().HasKey(dp => dp.Id);

        modelBuilder.Entity<DigitalProduct>()
            .UseTpcMappingStrategy();

        modelBuilder.Entity<DigitalProduct>()
            .HasOne(dp => dp.Merchant)
            .WithMany()
            .HasForeignKey(dp => dp.MerchantId);

        modelBuilder.Entity<DigitalProduct>()
            .HasMany(dp => dp.Categories)
            .WithMany();

        modelBuilder.Entity<DigitalProduct>()
            .HasIndex(dp => new { dp.MerchantId, dp.Sku, dp.Environment })
            .IsUnique()
            .HasFilter("\"Sku\" IS NOT NULL");

        modelBuilder.Entity<DigitalProduct>()
            .HasQueryFilter(dp => dp.Environment == CurrentEnvironment);

        // DigitalProductVariant
        modelBuilder.Entity<DigitalProductVariant>().HasKey(v => v.Id);

        modelBuilder.Entity<DigitalProductVariant>()
            .HasOne(v => v.DigitalProduct)
            .WithMany(p => p.Variants)
            .HasForeignKey(v => v.DigitalProductId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DigitalProductVariant>()
            .HasIndex(v => new { v.DigitalProductId, v.Sku })
            .IsUnique()
            .HasFilter("\"Sku\" IS NOT NULL");

        // DigitalProductItem (replaces DigitalItem for new products)
        modelBuilder.Entity<DigitalProductItem>().HasKey(di => di.Id);

        modelBuilder.Entity<DigitalProductItem>()
            .HasOne(di => di.DigitalProduct)
            .WithMany(dp => dp.Items)
            .HasForeignKey(di => di.DigitalProductId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DigitalProductItem>()
            .HasOne(di => di.DigitalProductVariant)
            .WithMany(v => v.Items)
            .HasForeignKey(di => di.DigitalProductVariantId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<DigitalProductItem>()
            .HasIndex(di => di.DigitalProductId);

        modelBuilder.Entity<DigitalProductItem>()
            .HasIndex(di => di.Status);

        modelBuilder.Entity<DigitalProductItem>()
            .HasIndex(di => new { di.DigitalProductId, di.Status });

        // ServiceProduct - TPC inheritance
        modelBuilder.Entity<ServiceProduct>().HasKey(sp => sp.Id);

        modelBuilder.Entity<ServiceProduct>()
            .UseTpcMappingStrategy();

        modelBuilder.Entity<ServiceProduct>()
            .HasOne(sp => sp.Merchant)
            .WithMany()
            .HasForeignKey(sp => sp.MerchantId);

        modelBuilder.Entity<ServiceProduct>()
            .HasMany(sp => sp.Categories)
            .WithMany();

        modelBuilder.Entity<ServiceProduct>()
            .HasIndex(sp => new { sp.MerchantId, sp.Sku, sp.Environment })
            .IsUnique()
            .HasFilter("\"Sku\" IS NOT NULL");

        modelBuilder.Entity<ServiceProduct>()
            .HasQueryFilter(sp => sp.Environment == CurrentEnvironment);

        // MerchantEmailSettings
        modelBuilder.Entity<MerchantEmailSettings>().HasKey(mes => mes.Id);

        modelBuilder.Entity<MerchantEmailSettings>()
            .HasOne(mes => mes.Merchant)
            .WithOne(m => m.EmailSettings)
            .HasForeignKey<MerchantEmailSettings>(mes => mes.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MerchantEmailSettings>()
            .HasIndex(mes => mes.MerchantId)
            .IsUnique();

        // Bulletin
        modelBuilder.Entity<Bulletin>().HasKey(b => b.Id);

        modelBuilder.Entity<Bulletin>()
            .HasOne(b => b.CreatedByUser)
            .WithMany()
            .HasForeignKey(b => b.CreatedByUserId);

        modelBuilder.Entity<Bulletin>()
            .HasIndex(b => b.ExpiresAt);

        // BulletinRead
        modelBuilder.Entity<BulletinRead>().HasKey(br => br.Id);

        modelBuilder.Entity<BulletinRead>()
            .HasOne(br => br.Bulletin)
            .WithMany(b => b.BulletinReads)
            .HasForeignKey(br => br.BulletinId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<BulletinRead>()
            .HasOne(br => br.User)
            .WithMany()
            .HasForeignKey(br => br.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<BulletinRead>()
            .HasIndex(br => new { br.BulletinId, br.UserId })
            .IsUnique();

        modelBuilder.Entity<BulletinRead>()
            .HasIndex(br => br.UserId);

        // BulletinReaction
        modelBuilder.Entity<BulletinReaction>().HasKey(br => br.Id);

        modelBuilder.Entity<BulletinReaction>()
            .HasOne(br => br.Bulletin)
            .WithMany(b => b.BulletinReactions)
            .HasForeignKey(br => br.BulletinId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<BulletinReaction>()
            .HasOne(br => br.User)
            .WithMany()
            .HasForeignKey(br => br.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<BulletinReaction>()
            .HasIndex(br => new { br.BulletinId, br.UserId, br.Emoji })
            .IsUnique();

        modelBuilder.Entity<BulletinReaction>()
            .HasIndex(br => br.BulletinId);

        // === Platform Payout Account ===
        modelBuilder.Entity<PlatformPayoutAccount>().HasKey(ppa => ppa.Id);

        modelBuilder.Entity<PlatformPayoutAccount>()
            .HasOne(ppa => ppa.CreatedByUser)
            .WithMany()
            .HasForeignKey(ppa => ppa.CreatedByUserId);

        modelBuilder.Entity<PlatformPayoutAccount>()
            .HasIndex(ppa => ppa.IsActive);

        // === Platform Payout ===
        modelBuilder.Entity<PlatformPayout>().HasKey(pp => pp.Id);

        modelBuilder.Entity<PlatformPayout>()
            .HasOne(pp => pp.PayoutAccount)
            .WithMany(ppa => ppa.PlatformPayouts)
            .HasForeignKey(pp => pp.PlatformPayoutAccountId);

        modelBuilder.Entity<PlatformPayout>()
            .HasOne(pp => pp.RequestedByUser)
            .WithMany()
            .HasForeignKey(pp => pp.RequestedByUserId);

        modelBuilder.Entity<PlatformPayout>()
            .HasQueryFilter(pp => pp.Environment == CurrentEnvironment);

        modelBuilder.Entity<PlatformPayout>()
            .HasIndex(pp => pp.Environment);

        modelBuilder.Entity<PlatformPayout>()
            .HasIndex(pp => pp.Status);

        // === Platform Payout Item ===
        modelBuilder.Entity<PlatformPayoutItem>().HasKey(ppi => ppi.Id);

        modelBuilder.Entity<PlatformPayoutItem>()
            .HasOne(ppi => ppi.PlatformPayout)
            .WithMany(pp => pp.Items)
            .HasForeignKey(ppi => ppi.PlatformPayoutId);

        modelBuilder.Entity<PlatformPayoutItem>()
            .HasOne(ppi => ppi.Acquirer)
            .WithMany()
            .HasForeignKey(ppi => ppi.AcquirerId);

        modelBuilder.Entity<PlatformPayoutItem>()
            .HasIndex(ppi => ppi.PlatformPayoutId);

        modelBuilder.Entity<PlatformPayoutItem>()
            .HasIndex(ppi => ppi.Status);

        // === User Ranking Cache ===
        modelBuilder.Entity<UserRankingCache>().HasKey(r => r.Id);

        modelBuilder.Entity<UserRankingCache>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserRankingCache>()
            .HasIndex(r => new { r.Period, r.Environment, r.Position });

        modelBuilder.Entity<UserRankingCache>()
            .HasIndex(r => new { r.UserId, r.Period, r.Environment })
            .IsUnique();

        modelBuilder.Entity<UserRankingCache>()
            .HasQueryFilter(r => r.Environment == CurrentEnvironment);

        // === Referral Ranking Cache ===
        modelBuilder.Entity<ReferralRankingCache>().HasKey(r => r.Id);

        modelBuilder.Entity<ReferralRankingCache>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ReferralRankingCache>()
            .HasIndex(r => new { r.Environment, r.Position });

        modelBuilder.Entity<ReferralRankingCache>()
            .HasIndex(r => new { r.UserId, r.Environment })
            .IsUnique();

        modelBuilder.Entity<ReferralRankingCache>()
            .HasQueryFilter(r => r.Environment == CurrentEnvironment);

        // === Acquirer Ranking Cache ===
        modelBuilder.Entity<AcquirerRankingCache>().HasKey(r => r.Id);

        modelBuilder.Entity<AcquirerRankingCache>()
            .HasOne(r => r.Acquirer)
            .WithMany()
            .HasForeignKey(r => r.AcquirerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AcquirerRankingCache>()
            .HasIndex(r => new { r.Environment, r.Position });

        modelBuilder.Entity<AcquirerRankingCache>()
            .HasIndex(r => new { r.AcquirerId, r.Environment })
            .IsUnique();

        modelBuilder.Entity<AcquirerRankingCache>()
            .HasQueryFilter(r => r.Environment == CurrentEnvironment);

        // === User Profile Image ===
        modelBuilder.Entity<User>()
            .HasOne(u => u.ProfileImage)
            .WithMany()
            .HasForeignKey(u => u.ProfileImageId)
            .OnDelete(DeleteBehavior.SetNull);

        // === User Selected Emblems ===
        modelBuilder.Entity<UserSelectedEmblem>().HasKey(use => use.Id);
        modelBuilder.Entity<UserSelectedEmblem>()
            .HasOne(use => use.User)
            .WithMany(u => u.SelectedEmblems)
            .HasForeignKey(use => use.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<UserSelectedEmblem>()
            .HasOne(use => use.Achievement)
            .WithMany()
            .HasForeignKey(use => use.AchievementId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<UserSelectedEmblem>()
            .HasIndex(use => new { use.UserId, use.AchievementId })
            .IsUnique();

        // === Achievements ===
        modelBuilder.Entity<Achievement>().HasKey(a => a.Id);
        modelBuilder.Entity<Achievement>()
            .HasIndex(a => a.Key)
            .IsUnique();
        modelBuilder.Entity<Achievement>()
            .HasMany(a => a.UserAchievements)
            .WithOne(ua => ua.Achievement)
            .HasForeignKey(ua => ua.AchievementId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserAchievement>().HasKey(ua => ua.Id);
        modelBuilder.Entity<UserAchievement>()
            .HasOne(ua => ua.User)
            .WithMany(u => u.UserAchievements)
            .HasForeignKey(ua => ua.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<UserAchievement>()
            .HasIndex(ua => new { ua.UserId, ua.AchievementId, ua.Environment })
            .IsUnique();

        modelBuilder.Entity<LevelConfig>().HasKey(lc => lc.Id);
        modelBuilder.Entity<LevelConfig>()
            .HasIndex(lc => lc.Level)
            .IsUnique();

        // === Automatic Cashout Log ===
        modelBuilder.Entity<AutomaticCashoutLog>().HasKey(acl => acl.Id);
        modelBuilder.Entity<AutomaticCashoutLog>()
            .HasOne(acl => acl.Merchant)
            .WithMany()
            .HasForeignKey(acl => acl.MerchantId)
            .OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<AutomaticCashoutLog>()
            .HasOne(acl => acl.Payout)
            .WithMany()
            .HasForeignKey(acl => acl.PayoutId)
            .OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<AutomaticCashoutLog>()
            .HasQueryFilter(acl => acl.Environment == CurrentEnvironment);

        base.OnModelCreating(modelBuilder);
    }

    public override int SaveChanges()
    {
        ApplyTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        ApplyTimestamps();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void ApplyTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is BaseEntity && (e.State == EntityState.Added || e.State == EntityState.Modified));

        foreach (var entry in entries)
        {
            var now = DateTime.UtcNow;

            if (entry.State == EntityState.Added && entry.Entity is BaseEntity entity)
                entity.GetType().GetProperty("CreatedAt")?.SetValue(entity, now);

            if (entry.Entity is BaseEntity updatedEntity)
                updatedEntity.GetType().GetProperty("UpdatedAt")?.SetValue(updatedEntity, now);
        }
    }

    private static List<AcquirerOperationType> ParseOperationTypes(List<string> values)
    {
        var result = new HashSet<AcquirerOperationType>();

        foreach (var rawValue in values)
        {
            if (string.IsNullOrWhiteSpace(rawValue))
            {
                continue;
            }

            var tokens = rawValue
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            foreach (var token in tokens)
            {
                if (Enum.TryParse<AcquirerOperationType>(token, ignoreCase: true, out var parsed))
                {
                    result.Add(parsed);
                }
            }
        }

        // Backward compatibility for legacy rows with empty/invalid serialized values.
        if (result.Count == 0)
        {
            result.Add(AcquirerOperationType.White);
            result.Add(AcquirerOperationType.Black);
        }

        return result.ToList();
    }
}

