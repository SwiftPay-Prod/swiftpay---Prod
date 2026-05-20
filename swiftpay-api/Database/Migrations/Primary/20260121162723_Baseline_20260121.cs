using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class Baseline_20260121 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Acquirers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    LogoUrl = table.Column<string>(type: "text", nullable: true),
                    Type = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ApiBaseUrl = table.Column<string>(type: "text", nullable: true),
                    ApiBaseUrlProduction = table.Column<string>(type: "text", nullable: true),
                    ApiBaseUrlSandbox = table.Column<string>(type: "text", nullable: true),
                    AuthType = table.Column<string>(type: "text", nullable: true),
                    DefaultApiKey = table.Column<string>(type: "text", nullable: true),
                    DefaultApiSecret = table.Column<string>(type: "text", nullable: true),
                    DefaultClientId = table.Column<string>(type: "text", nullable: true),
                    DefaultClientSecret = table.Column<string>(type: "text", nullable: true),
                    DefaultApiKeySandbox = table.Column<string>(type: "text", nullable: true),
                    DefaultApiSecretSandbox = table.Column<string>(type: "text", nullable: true),
                    DefaultClientIdSandbox = table.Column<string>(type: "text", nullable: true),
                    DefaultClientSecretSandbox = table.Column<string>(type: "text", nullable: true),
                    SupportsPix = table.Column<bool>(type: "boolean", nullable: false),
                    SupportsBoleto = table.Column<bool>(type: "boolean", nullable: false),
                    SupportsCreditCard = table.Column<bool>(type: "boolean", nullable: false),
                    SupportsWithdrawal = table.Column<bool>(type: "boolean", nullable: false),
                    SupportsRefund = table.Column<bool>(type: "boolean", nullable: false),
                    MinPayoutAmount = table.Column<long>(type: "bigint", nullable: false),
                    WebhookAuthMode = table.Column<string>(type: "text", nullable: false),
                    WebhookToken = table.Column<string>(type: "text", nullable: true),
                    WebhookAllowedIps = table.Column<string>(type: "text", nullable: true),
                    DocumentationUrl = table.Column<string>(type: "text", nullable: true),
                    WebhookDocumentationUrl = table.Column<string>(type: "text", nullable: true),
                    PixInFeeMode = table.Column<string>(type: "text", nullable: false),
                    PixInFeeFixed = table.Column<long>(type: "bigint", nullable: false),
                    PixInFeePercentage = table.Column<int>(type: "integer", nullable: false),
                    PayoutFeeMode = table.Column<string>(type: "text", nullable: false),
                    PayoutFeeFixed = table.Column<long>(type: "bigint", nullable: false),
                    PayoutFeePercentage = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Acquirers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AdminDashboardCaches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TotalUsers = table.Column<int>(type: "integer", nullable: false),
                    ActiveUsers = table.Column<int>(type: "integer", nullable: false),
                    InactiveUsers = table.Column<int>(type: "integer", nullable: false),
                    SuspendedUsers = table.Column<int>(type: "integer", nullable: false),
                    EmailVerifiedUsers = table.Column<int>(type: "integer", nullable: false),
                    NewUsersToday = table.Column<int>(type: "integer", nullable: false),
                    NewUsersThisWeek = table.Column<int>(type: "integer", nullable: false),
                    NewUsersThisMonth = table.Column<int>(type: "integer", nullable: false),
                    TotalMerchants = table.Column<int>(type: "integer", nullable: false),
                    ActiveMerchants = table.Column<int>(type: "integer", nullable: false),
                    DraftMerchants = table.Column<int>(type: "integer", nullable: false),
                    SuspendedMerchants = table.Column<int>(type: "integer", nullable: false),
                    PendingKycMerchants = table.Column<int>(type: "integer", nullable: false),
                    ApprovedKycMerchants = table.Column<int>(type: "integer", nullable: false),
                    RejectedKycMerchants = table.Column<int>(type: "integer", nullable: false),
                    NewMerchantsThisMonth = table.Column<int>(type: "integer", nullable: false),
                    TotalVolume = table.Column<long>(type: "bigint", nullable: false),
                    TotalFees = table.Column<long>(type: "bigint", nullable: false),
                    VolumeToday = table.Column<long>(type: "bigint", nullable: false),
                    FeesToday = table.Column<long>(type: "bigint", nullable: false),
                    VolumeThisWeek = table.Column<long>(type: "bigint", nullable: false),
                    FeesThisWeek = table.Column<long>(type: "bigint", nullable: false),
                    VolumeThisMonth = table.Column<long>(type: "bigint", nullable: false),
                    FeesThisMonth = table.Column<long>(type: "bigint", nullable: false),
                    TotalTransactions = table.Column<int>(type: "integer", nullable: false),
                    CompletedTransactions = table.Column<int>(type: "integer", nullable: false),
                    FailedTransactions = table.Column<int>(type: "integer", nullable: false),
                    PendingTransactions = table.Column<int>(type: "integer", nullable: false),
                    ApprovalRate = table.Column<decimal>(type: "numeric", nullable: false),
                    TotalPayouts = table.Column<int>(type: "integer", nullable: false),
                    TotalPayoutAmount = table.Column<long>(type: "bigint", nullable: false),
                    VolumeChartJson = table.Column<string>(type: "text", nullable: false),
                    RegistrationChartJson = table.Column<string>(type: "text", nullable: false),
                    CalculatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsProcessing = table.Column<bool>(type: "boolean", nullable: false),
                    NextProcessAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminDashboardCaches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CheckoutTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PreviewImageUrl = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    UsageCount = table.Column<int>(type: "integer", nullable: false),
                    SupportsMultipleProducts = table.Column<bool>(type: "boolean", nullable: false),
                    SupportsCoupons = table.Column<bool>(type: "boolean", nullable: false),
                    SupportsShipping = table.Column<bool>(type: "boolean", nullable: false),
                    HasExpiration = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CheckoutTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PlatformSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PixMinTransactionAmount = table.Column<long>(type: "bigint", nullable: false),
                    PixMaxTransactionAmount = table.Column<long>(type: "bigint", nullable: false),
                    PixTimeoutMinutes = table.Column<int>(type: "integer", nullable: false),
                    PixApiFeeMode = table.Column<string>(type: "text", nullable: false),
                    PixApiFeeFixed = table.Column<long>(type: "bigint", nullable: false),
                    PixApiFeePercentage = table.Column<int>(type: "integer", nullable: false),
                    PixCheckoutFeeMode = table.Column<string>(type: "text", nullable: false),
                    PixCheckoutFeeFixed = table.Column<long>(type: "bigint", nullable: false),
                    PixCheckoutFeePercentage = table.Column<int>(type: "integer", nullable: false),
                    WithdrawalFeeMode = table.Column<string>(type: "text", nullable: false),
                    WithdrawalFeeFixed = table.Column<long>(type: "bigint", nullable: false),
                    WithdrawalFeePercentage = table.Column<int>(type: "integer", nullable: false),
                    MinWithdrawalAmount = table.Column<long>(type: "bigint", nullable: false),
                    WithdrawalApprovalMode = table.Column<string>(type: "text", nullable: false),
                    RateLimitPerMinute = table.Column<int>(type: "integer", nullable: false),
                    RateLimitPerHour = table.Column<int>(type: "integer", nullable: false),
                    RateLimitPerDay = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    Password = table.Column<string>(type: "text", nullable: false),
                    EmailVerified = table.Column<bool>(type: "boolean", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    TwoFactorSecret = table.Column<string>(type: "text", nullable: true),
                    FailedLoginAttempts = table.Column<int>(type: "integer", nullable: false),
                    IsLockedOut = table.Column<bool>(type: "boolean", nullable: false),
                    LockedOutAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PasswordChangedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastLoginIpAddress = table.Column<string>(type: "text", nullable: true),
                    LastLoginUserAgent = table.Column<string>(type: "text", nullable: true),
                    LastLoginLocation = table.Column<string>(type: "text", nullable: true),
                    Role = table.Column<string>(type: "text", nullable: false),
                    InactiveReason = table.Column<string>(type: "text", nullable: true),
                    SuspendedReason = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AcquirerDashboardCaches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AcquirerId = table.Column<Guid>(type: "uuid", nullable: false),
                    TotalMerchants = table.Column<int>(type: "integer", nullable: false),
                    TotalTransactions = table.Column<int>(type: "integer", nullable: false),
                    CompletedTransactions = table.Column<int>(type: "integer", nullable: false),
                    FailedTransactions = table.Column<int>(type: "integer", nullable: false),
                    ExpiredTransactions = table.Column<int>(type: "integer", nullable: false),
                    ApprovalRate = table.Column<decimal>(type: "numeric", nullable: false),
                    TotalVolume = table.Column<long>(type: "bigint", nullable: false),
                    TotalAcquirerFees = table.Column<long>(type: "bigint", nullable: false),
                    TotalPlatformFees = table.Column<long>(type: "bigint", nullable: false),
                    TotalProfit = table.Column<long>(type: "bigint", nullable: false),
                    TotalPayouts = table.Column<int>(type: "integer", nullable: false),
                    TotalPayoutVolume = table.Column<long>(type: "bigint", nullable: false),
                    TotalPayoutAcquirerFees = table.Column<long>(type: "bigint", nullable: false),
                    TotalPayoutPlatformFees = table.Column<long>(type: "bigint", nullable: false),
                    TotalPayoutProfit = table.Column<long>(type: "bigint", nullable: false),
                    VolumeToday = table.Column<long>(type: "bigint", nullable: false),
                    VolumeThisWeek = table.Column<long>(type: "bigint", nullable: false),
                    VolumeThisMonth = table.Column<long>(type: "bigint", nullable: false),
                    VolumeChartJson = table.Column<string>(type: "text", nullable: false),
                    ProfitChartJson = table.Column<string>(type: "text", nullable: false),
                    CalculatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AcquirerDashboardCaches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AcquirerDashboardCaches_Acquirers_AcquirerId",
                        column: x => x.AcquirerId,
                        principalTable: "Acquirers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DeviceVerificationCodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CodeHash = table.Column<string>(type: "text", nullable: false),
                    DeviceId = table.Column<string>(type: "text", nullable: false),
                    DeviceName = table.Column<string>(type: "text", nullable: true),
                    Browser = table.Column<string>(type: "text", nullable: true),
                    OperatingSystem = table.Column<string>(type: "text", nullable: true),
                    IpAddress = table.Column<string>(type: "text", nullable: true),
                    Location = table.Column<string>(type: "text", nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FailedAttempts = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeviceVerificationCodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeviceVerificationCodes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EmailConfirmationTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TokenHash = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailConfirmationTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmailConfirmationTokens_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Merchants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    KycStatus = table.Column<string>(type: "text", nullable: false),
                    OnboardingStep = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    Address = table.Column<string>(type: "text", nullable: true),
                    AddressNumber = table.Column<string>(type: "text", nullable: true),
                    AddressComplement = table.Column<string>(type: "text", nullable: true),
                    Neighborhood = table.Column<string>(type: "text", nullable: true),
                    City = table.Column<string>(type: "text", nullable: true),
                    State = table.Column<string>(type: "text", nullable: true),
                    PostalCode = table.Column<string>(type: "text", nullable: true),
                    Country = table.Column<string>(type: "text", nullable: true),
                    InactiveReason = table.Column<string>(type: "text", nullable: true),
                    SuspendedReason = table.Column<string>(type: "text", nullable: true),
                    DeletedReason = table.Column<string>(type: "text", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    OnboardingCompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    KycSubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    KycApprovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    KycRejectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Merchants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Merchants_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PasswordChangeCodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CodeHash = table.Column<string>(type: "text", nullable: false),
                    NewPasswordHash = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PasswordChangeCodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PasswordChangeCodes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PasswordResetCodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CodeHash = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PasswordResetCodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PasswordResetCodes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PushTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeviceId = table.Column<string>(type: "text", nullable: true),
                    Token = table.Column<string>(type: "text", nullable: false),
                    Platform = table.Column<string>(type: "text", nullable: false),
                    DeviceName = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    LastUsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PushTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PushTokens_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Token = table.Column<string>(type: "text", nullable: false),
                    TokenHash = table.Column<string>(type: "text", nullable: false),
                    DeviceId = table.Column<string>(type: "text", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RevokedReason = table.Column<string>(type: "text", nullable: true),
                    ReplacedByTokenId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefreshTokens_RefreshTokens_ReplacedByTokenId",
                        column: x => x.ReplacedByTokenId,
                        principalTable: "RefreshTokens",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_RefreshTokens_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StoredFiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ObjectName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    OriginalFileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Size = table.Column<long>(type: "bigint", nullable: false),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    Folder = table.Column<string>(type: "text", nullable: false),
                    OwnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    UploaderId = table.Column<Guid>(type: "uuid", nullable: false),
                    CachedUrl = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CachedUrlExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoredFiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StoredFiles_Users_UploaderId",
                        column: x => x.UploaderId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrustedDevices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeviceId = table.Column<string>(type: "text", nullable: false),
                    DeviceName = table.Column<string>(type: "text", nullable: true),
                    Browser = table.Column<string>(type: "text", nullable: true),
                    OperatingSystem = table.Column<string>(type: "text", nullable: true),
                    LastIpAddress = table.Column<string>(type: "text", nullable: true),
                    LastLocation = table.Column<string>(type: "text", nullable: true),
                    LastUsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrustedDevices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrustedDevices_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserNotificationPreferences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    PushNotificationsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    InAppNotificationsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    NotifyPaymentPending = table.Column<bool>(type: "boolean", nullable: false),
                    NotifyPaymentCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    NotifyPaymentExpired = table.Column<bool>(type: "boolean", nullable: false),
                    NotifyPaymentFailed = table.Column<bool>(type: "boolean", nullable: false),
                    NotifyPaymentRefunded = table.Column<bool>(type: "boolean", nullable: false),
                    NotifyPayoutPending = table.Column<bool>(type: "boolean", nullable: false),
                    NotifyPayoutProcessing = table.Column<bool>(type: "boolean", nullable: false),
                    NotifyPayoutCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    NotifyPayoutFailed = table.Column<bool>(type: "boolean", nullable: false),
                    NotifyPayoutRejected = table.Column<bool>(type: "boolean", nullable: false),
                    NotifyPayoutCancelled = table.Column<bool>(type: "boolean", nullable: false),
                    NotifyInfo = table.Column<bool>(type: "boolean", nullable: false),
                    NotifySuccess = table.Column<bool>(type: "boolean", nullable: false),
                    NotifyWarning = table.Column<bool>(type: "boolean", nullable: false),
                    NotifyError = table.Column<bool>(type: "boolean", nullable: false),
                    NotifySecurity = table.Column<bool>(type: "boolean", nullable: false),
                    NotifySystem = table.Column<bool>(type: "boolean", nullable: false),
                    NotifyChargeback = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserNotificationPreferences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserNotificationPreferences_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Accounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: true),
                    AcquirerId = table.Column<Guid>(type: "uuid", nullable: true),
                    Currency = table.Column<string>(type: "text", nullable: false),
                    Balance = table.Column<long>(type: "bigint", nullable: false),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Accounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Accounts_Acquirers_AcquirerId",
                        column: x => x.AcquirerId,
                        principalTable: "Acquirers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Accounts_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    ExternalId = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Categories_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Checkouts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    CheckoutTemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Checkouts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Checkouts_CheckoutTemplates_CheckoutTemplateId",
                        column: x => x.CheckoutTemplateId,
                        principalTable: "CheckoutTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Checkouts_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Coupons",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DiscountType = table.Column<string>(type: "text", nullable: false),
                    DiscountFixedAmount = table.Column<long>(type: "bigint", nullable: true),
                    DiscountPercentage = table.Column<int>(type: "integer", nullable: true),
                    MaxDiscountAmount = table.Column<long>(type: "bigint", nullable: true),
                    MinOrderAmount = table.Column<long>(type: "bigint", nullable: true),
                    MaxUses = table.Column<int>(type: "integer", nullable: true),
                    CurrentUses = table.Column<int>(type: "integer", nullable: false),
                    MaxUsesPerCustomer = table.Column<int>(type: "integer", nullable: true),
                    ValidFrom = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ValidUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ApplyToAllProducts = table.Column<bool>(type: "boolean", nullable: false),
                    ApplyToAllCheckouts = table.Column<bool>(type: "boolean", nullable: false),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Coupons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Coupons_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Customers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExternalId = table.Column<string>(type: "text", nullable: true),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    Document = table.Column<string>(type: "text", nullable: true),
                    DocumentType = table.Column<string>(type: "text", nullable: true),
                    Phone = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Metadata = table.Column<string>(type: "text", nullable: true),
                    AddressStreet = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    AddressNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    AddressComplement = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    AddressNeighborhood = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    AddressCity = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    AddressState = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    AddressPostalCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    AddressCountry = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Customers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Customers_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MerchantAcquirers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    AcquirerId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    ApiKey = table.Column<string>(type: "text", nullable: true),
                    ApiSecret = table.Column<string>(type: "text", nullable: true),
                    ClientId = table.Column<string>(type: "text", nullable: true),
                    ClientSecret = table.Column<string>(type: "text", nullable: true),
                    AccessToken = table.Column<string>(type: "text", nullable: true),
                    RefreshToken = table.Column<string>(type: "text", nullable: true),
                    TokenExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AdditionalSettings = table.Column<string>(type: "text", nullable: true),
                    PixInFeeMode = table.Column<string>(type: "text", nullable: false),
                    PixInFeeFixed = table.Column<long>(type: "bigint", nullable: false),
                    PixInFeePercentage = table.Column<int>(type: "integer", nullable: false),
                    PayoutFeeMode = table.Column<string>(type: "text", nullable: false),
                    PayoutFeeFixed = table.Column<long>(type: "bigint", nullable: false),
                    PayoutFeePercentage = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchantAcquirers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchantAcquirers_Acquirers_AcquirerId",
                        column: x => x.AcquirerId,
                        principalTable: "Acquirers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MerchantAcquirers_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MerchantApiCredentials",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: true),
                    ClientId = table.Column<string>(type: "text", nullable: false),
                    ClientSecretHash = table.Column<string>(type: "text", nullable: false),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    SecretVersion = table.Column<int>(type: "integer", nullable: false),
                    AllowedIpRange = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchantApiCredentials", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchantApiCredentials_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MerchantBalances",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    LifetimeVolume = table.Column<long>(type: "bigint", nullable: false),
                    LifetimePayouts = table.Column<long>(type: "bigint", nullable: false),
                    LifetimeRefunds = table.Column<long>(type: "bigint", nullable: false),
                    LifetimeFeesPaid = table.Column<long>(type: "bigint", nullable: false),
                    VolumeToday = table.Column<long>(type: "bigint", nullable: false),
                    TodayDate = table.Column<DateOnly>(type: "date", nullable: false),
                    VolumeThisWeek = table.Column<long>(type: "bigint", nullable: false),
                    WeekNumber = table.Column<int>(type: "integer", nullable: false),
                    WeekYear = table.Column<int>(type: "integer", nullable: false),
                    VolumeThisMonth = table.Column<long>(type: "bigint", nullable: false),
                    MonthNumber = table.Column<int>(type: "integer", nullable: false),
                    MonthYear = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchantBalances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchantBalances_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MerchantDashboardCaches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    TotalVolume = table.Column<long>(type: "bigint", nullable: false),
                    TotalFees = table.Column<long>(type: "bigint", nullable: false),
                    ApprovalRate = table.Column<decimal>(type: "numeric", nullable: false),
                    ChargebackCount = table.Column<int>(type: "integer", nullable: false),
                    ChargebackRate = table.Column<decimal>(type: "numeric", nullable: false),
                    FailedTransactions = table.Column<int>(type: "integer", nullable: false),
                    FailedRate = table.Column<decimal>(type: "numeric", nullable: false),
                    TotalTransactions = table.Column<int>(type: "integer", nullable: false),
                    CompletedTransactions = table.Column<int>(type: "integer", nullable: false),
                    VolumeToday = table.Column<long>(type: "bigint", nullable: false),
                    VolumeThisWeek = table.Column<long>(type: "bigint", nullable: false),
                    VolumeThisMonth = table.Column<long>(type: "bigint", nullable: false),
                    VolumeChartJson = table.Column<string>(type: "text", nullable: false),
                    WeeklyChartJson = table.Column<string>(type: "text", nullable: false),
                    CalculatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsProcessing = table.Column<bool>(type: "boolean", nullable: false),
                    NextProcessAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchantDashboardCaches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchantDashboardCaches_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MerchantDeletionCodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CodeHash = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchantDeletionCodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchantDeletionCodes_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MerchantDeletionCodes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MerchantKycPendingItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Response = table.Column<string>(type: "text", nullable: true),
                    RespondedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AdminNotes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchantKycPendingItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchantKycPendingItems_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MerchantKycPendingItems_Users_RequestedByUserId",
                        column: x => x.RequestedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MerchantPayoutAccounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    PixKeyType = table.Column<string>(type: "text", nullable: false),
                    PixKey = table.Column<string>(type: "text", nullable: false),
                    HolderName = table.Column<string>(type: "text", nullable: true),
                    HolderDocument = table.Column<string>(type: "text", nullable: true),
                    BankName = table.Column<string>(type: "text", nullable: true),
                    BankIspb = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchantPayoutAccounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchantPayoutAccounts_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MerchantSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    MicrosoftClarityCode = table.Column<string>(type: "text", nullable: true),
                    MicrosoftClarityIsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    PixMinTransactionAmount = table.Column<long>(type: "bigint", nullable: true),
                    PixMaxTransactionAmount = table.Column<long>(type: "bigint", nullable: true),
                    PixApiFeeMode = table.Column<string>(type: "text", nullable: true),
                    PixApiFeeFixed = table.Column<long>(type: "bigint", nullable: true),
                    PixApiFeePercentage = table.Column<int>(type: "integer", nullable: true),
                    PixCheckoutFeeMode = table.Column<string>(type: "text", nullable: true),
                    PixCheckoutFeeFixed = table.Column<long>(type: "bigint", nullable: true),
                    PixCheckoutFeePercentage = table.Column<int>(type: "integer", nullable: true),
                    WithdrawalFeeMode = table.Column<string>(type: "text", nullable: true),
                    WithdrawalFeeFixed = table.Column<long>(type: "bigint", nullable: true),
                    WithdrawalFeePercentage = table.Column<int>(type: "integer", nullable: true),
                    MinWithdrawalAmount = table.Column<long>(type: "bigint", nullable: true),
                    WithdrawalApprovalMode = table.Column<string>(type: "text", nullable: true),
                    RateLimitPerMinute = table.Column<int>(type: "integer", nullable: true),
                    RateLimitPerHour = table.Column<int>(type: "integer", nullable: true),
                    RateLimitPerDay = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchantSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchantSettings_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Scope = table.Column<string>(type: "text", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    StatusType = table.Column<string>(type: "text", nullable: true),
                    Priority = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    ActionUrl = table.Column<string>(type: "text", nullable: true),
                    ActionLabel = table.Column<string>(type: "text", nullable: true),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    ExternalId = table.Column<string>(type: "text", nullable: true),
                    ImageUrl = table.Column<string>(type: "text", nullable: true),
                    ImageUrls = table.Column<string>(type: "jsonb", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Brand = table.Column<string>(type: "text", nullable: true),
                    Price = table.Column<long>(type: "bigint", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Products_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MerchantKycs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    LegalName = table.Column<string>(type: "text", nullable: true),
                    DocumentType = table.Column<string>(type: "text", nullable: true),
                    DocumentNumber = table.Column<string>(type: "text", nullable: true),
                    IdentityDocumentType = table.Column<string>(type: "text", nullable: true),
                    IdentityDocumentNumber = table.Column<string>(type: "text", nullable: true),
                    ProofOfAddressFileId = table.Column<Guid>(type: "uuid", nullable: true),
                    DocumentFrontFileId = table.Column<Guid>(type: "uuid", nullable: true),
                    DocumentBackFileId = table.Column<Guid>(type: "uuid", nullable: true),
                    SelfieFileId = table.Column<Guid>(type: "uuid", nullable: true),
                    OperationType = table.Column<string>(type: "text", nullable: true),
                    BusinessDescription = table.Column<string>(type: "text", nullable: true),
                    Website = table.Column<string>(type: "text", nullable: true),
                    ExpectedMonthlyVolume = table.Column<decimal>(type: "numeric", nullable: true),
                    AdminNotes = table.Column<string>(type: "text", nullable: true),
                    RejectionReason = table.Column<string>(type: "text", nullable: true),
                    ApprovalReason = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchantKycs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchantKycs_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MerchantKycs_StoredFiles_DocumentBackFileId",
                        column: x => x.DocumentBackFileId,
                        principalTable: "StoredFiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MerchantKycs_StoredFiles_DocumentFrontFileId",
                        column: x => x.DocumentFrontFileId,
                        principalTable: "StoredFiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MerchantKycs_StoredFiles_ProofOfAddressFileId",
                        column: x => x.ProofOfAddressFileId,
                        principalTable: "StoredFiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MerchantKycs_StoredFiles_SelfieFileId",
                        column: x => x.SelfieFileId,
                        principalTable: "StoredFiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "CheckoutConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CheckoutId = table.Column<Guid>(type: "uuid", nullable: false),
                    PixEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    CreditCardEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    BoletoEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    PixExpirationMinutes = table.Column<int>(type: "integer", nullable: false),
                    CouponEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    ShippingEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    RequireCustomerInfo = table.Column<bool>(type: "boolean", nullable: false),
                    RequireCustomerAddress = table.Column<bool>(type: "boolean", nullable: false),
                    RequireCustomerDocument = table.Column<bool>(type: "boolean", nullable: false),
                    AllowQuantityChange = table.Column<bool>(type: "boolean", nullable: false),
                    SuccessUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CancelUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CallbackUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PrimaryColor = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    SecondaryColor = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    BackgroundColor = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    LogoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    BackgroundImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FaviconUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    HeaderMessage = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FooterMessage = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SuccessMessage = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PageTitle = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CheckoutConfigs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CheckoutConfigs_Checkouts_CheckoutId",
                        column: x => x.CheckoutId,
                        principalTable: "Checkouts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CheckoutCoupon",
                columns: table => new
                {
                    CheckoutsId = table.Column<Guid>(type: "uuid", nullable: false),
                    CouponsId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CheckoutCoupon", x => new { x.CheckoutsId, x.CouponsId });
                    table.ForeignKey(
                        name: "FK_CheckoutCoupon_Checkouts_CheckoutsId",
                        column: x => x.CheckoutsId,
                        principalTable: "Checkouts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CheckoutCoupon_Coupons_CouponsId",
                        column: x => x.CouponsId,
                        principalTable: "Coupons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ApiCredentialCodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CredentialId = table.Column<Guid>(type: "uuid", nullable: true),
                    CodeHash = table.Column<string>(type: "text", nullable: false),
                    Action = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CredentialName = table.Column<string>(type: "text", nullable: true),
                    CredentialEnvironment = table.Column<string>(type: "text", nullable: true),
                    CredentialAllowedIpRange = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApiCredentialCodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ApiCredentialCodes_MerchantApiCredentials_CredentialId",
                        column: x => x.CredentialId,
                        principalTable: "MerchantApiCredentials",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ApiCredentialCodes_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ApiCredentialCodes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PayoutAccountVerificationCodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantPayoutAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CodeHash = table.Column<string>(type: "text", nullable: false),
                    ActionType = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PayoutAccountVerificationCodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PayoutAccountVerificationCodes_MerchantPayoutAccounts_Merch~",
                        column: x => x.MerchantPayoutAccountId,
                        principalTable: "MerchantPayoutAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PayoutAccountVerificationCodes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Payouts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantPayoutAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantAcquirerId = table.Column<Guid>(type: "uuid", nullable: false),
                    AcquirerTransactionId = table.Column<string>(type: "text", nullable: true),
                    AcquirerPayoutId = table.Column<string>(type: "text", nullable: true),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<long>(type: "bigint", nullable: false),
                    PlatformFee = table.Column<long>(type: "bigint", nullable: false),
                    AcquirerFee = table.Column<long>(type: "bigint", nullable: false),
                    NetAmount = table.Column<long>(type: "bigint", nullable: false),
                    PixEndToEndId = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    AcquirerStatus = table.Column<string>(type: "text", nullable: true),
                    FailureReason = table.Column<string>(type: "text", nullable: true),
                    RequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EvaluatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    EvaluatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payouts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payouts_MerchantAcquirers_MerchantAcquirerId",
                        column: x => x.MerchantAcquirerId,
                        principalTable: "MerchantAcquirers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Payouts_MerchantPayoutAccounts_MerchantPayoutAccountId",
                        column: x => x.MerchantPayoutAccountId,
                        principalTable: "MerchantPayoutAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Payouts_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Payouts_Users_EvaluatedById",
                        column: x => x.EvaluatedById,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CategoryProduct",
                columns: table => new
                {
                    CategoriesId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductsId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoryProduct", x => new { x.CategoriesId, x.ProductsId });
                    table.ForeignKey(
                        name: "FK_CategoryProduct_Categories_CategoriesId",
                        column: x => x.CategoriesId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CategoryProduct_Products_ProductsId",
                        column: x => x.ProductsId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CouponProduct",
                columns: table => new
                {
                    CouponId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductsId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CouponProduct", x => new { x.CouponId, x.ProductsId });
                    table.ForeignKey(
                        name: "FK_CouponProduct_Coupons_CouponId",
                        column: x => x.CouponId,
                        principalTable: "Coupons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CouponProduct_Products_ProductsId",
                        column: x => x.ProductsId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Variants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    ExternalId = table.Column<string>(type: "text", nullable: true),
                    SKU = table.Column<string>(type: "text", nullable: true),
                    Price = table.Column<long>(type: "bigint", nullable: false),
                    StockQuantity = table.Column<int>(type: "integer", nullable: true),
                    ImageUrl = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Variants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Variants_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CheckoutProducts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CheckoutId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    VariantId = table.Column<Guid>(type: "uuid", nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    CustomPrice = table.Column<long>(type: "bigint", nullable: true),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    MaxQuantity = table.Column<int>(type: "integer", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CheckoutProducts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CheckoutProducts_Checkouts_CheckoutId",
                        column: x => x.CheckoutId,
                        principalTable: "Checkouts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CheckoutProducts_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CheckoutProducts_Variants_VariantId",
                        column: x => x.VariantId,
                        principalTable: "Variants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantAcquirerId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: true),
                    ExternalId = table.Column<string>(type: "text", nullable: true),
                    AcquirerTransactionId = table.Column<string>(type: "text", nullable: true),
                    AcquirerId = table.Column<Guid>(type: "uuid", nullable: true),
                    AcquirerPaymentId = table.Column<string>(type: "text", nullable: true),
                    Amount = table.Column<long>(type: "bigint", nullable: false),
                    PlatformFee = table.Column<long>(type: "bigint", nullable: false),
                    AcquirerFee = table.Column<long>(type: "bigint", nullable: false),
                    NetAmount = table.Column<long>(type: "bigint", nullable: false),
                    AcquirerNetAmount = table.Column<long>(type: "bigint", nullable: false),
                    CheckoutId = table.Column<Guid>(type: "uuid", nullable: true),
                    CouponId = table.Column<Guid>(type: "uuid", nullable: true),
                    DiscountAmount = table.Column<long>(type: "bigint", nullable: false),
                    ShippingAmount = table.Column<long>(type: "bigint", nullable: false),
                    SubtotalAmount = table.Column<long>(type: "bigint", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Method = table.Column<string>(type: "text", nullable: false),
                    Currency = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    AcquirerStatus = table.Column<string>(type: "text", nullable: true),
                    FailureReason = table.Column<string>(type: "text", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RefundedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RefundedAmount = table.Column<long>(type: "bigint", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Metadata = table.Column<string>(type: "text", nullable: true),
                    CallbackUrl = table.Column<string>(type: "text", nullable: true),
                    CallbackStatus = table.Column<string>(type: "text", nullable: false),
                    CallbackAttempts = table.Column<int>(type: "integer", nullable: false),
                    CallbackLastAttemptAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CallbackError = table.Column<string>(type: "text", nullable: true),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    RequestOrigin = table.Column<string>(type: "text", nullable: true),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: true),
                    VariantId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payments_Checkouts_CheckoutId",
                        column: x => x.CheckoutId,
                        principalTable: "Checkouts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Payments_Coupons_CouponId",
                        column: x => x.CouponId,
                        principalTable: "Coupons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Payments_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Payments_MerchantAcquirers_MerchantAcquirerId",
                        column: x => x.MerchantAcquirerId,
                        principalTable: "MerchantAcquirers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Payments_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Payments_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Payments_Variants_VariantId",
                        column: x => x.VariantId,
                        principalTable: "Variants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "LedgerTransactions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<long>(type: "bigint", nullable: false),
                    Operation = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    PaymentId = table.Column<Guid>(type: "uuid", nullable: true),
                    PayoutId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LedgerTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LedgerTransactions_Payments_PaymentId",
                        column: x => x.PaymentId,
                        principalTable: "Payments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_LedgerTransactions_Payouts_PayoutId",
                        column: x => x.PayoutId,
                        principalTable: "Payouts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PaymentItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PaymentId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    VariantId = table.Column<Guid>(type: "uuid", nullable: true),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    UnitPrice = table.Column<long>(type: "bigint", nullable: false),
                    TotalAmount = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentItems_Payments_PaymentId",
                        column: x => x.PaymentId,
                        principalTable: "Payments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PaymentItems_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PaymentItems_Variants_VariantId",
                        column: x => x.VariantId,
                        principalTable: "Variants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PaymentsPix",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PaymentId = table.Column<Guid>(type: "uuid", nullable: false),
                    TxId = table.Column<string>(type: "text", nullable: true),
                    EndToEndId = table.Column<string>(type: "text", nullable: true),
                    QrCodePayload = table.Column<string>(type: "text", nullable: true),
                    QrCodeBase64 = table.Column<string>(type: "text", nullable: true),
                    QrCode = table.Column<string>(type: "text", nullable: true),
                    CopyAndPaste = table.Column<string>(type: "text", nullable: true),
                    PixKey = table.Column<string>(type: "text", nullable: true),
                    PixKeyType = table.Column<string>(type: "text", nullable: true),
                    PayerName = table.Column<string>(type: "text", nullable: true),
                    PayerDocument = table.Column<string>(type: "text", nullable: true),
                    PayerBank = table.Column<string>(type: "text", nullable: true),
                    PayerBranch = table.Column<string>(type: "text", nullable: true),
                    PayerAccount = table.Column<string>(type: "text", nullable: true),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentsPix", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentsPix_Payments_PaymentId",
                        column: x => x.PaymentId,
                        principalTable: "Payments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LedgerEntries",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    LedgerTransactionId = table.Column<string>(type: "text", nullable: false),
                    AccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<long>(type: "bigint", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LedgerEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LedgerEntries_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LedgerEntries_LedgerTransactions_LedgerTransactionId",
                        column: x => x.LedgerTransactionId,
                        principalTable: "LedgerTransactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_AcquirerId",
                table: "Accounts",
                column: "AcquirerId");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_MerchantId",
                table: "Accounts",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_MerchantId_Type_Environment",
                table: "Accounts",
                columns: new[] { "MerchantId", "Type", "Environment" },
                unique: true,
                filter: "\"MerchantId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AcquirerDashboardCaches_AcquirerId",
                table: "AcquirerDashboardCaches",
                column: "AcquirerId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ApiCredentialCodes_CodeHash",
                table: "ApiCredentialCodes",
                column: "CodeHash");

            migrationBuilder.CreateIndex(
                name: "IX_ApiCredentialCodes_CredentialId",
                table: "ApiCredentialCodes",
                column: "CredentialId");

            migrationBuilder.CreateIndex(
                name: "IX_ApiCredentialCodes_MerchantId",
                table: "ApiCredentialCodes",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_ApiCredentialCodes_UserId",
                table: "ApiCredentialCodes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_MerchantId_ExternalId",
                table: "Categories",
                columns: new[] { "MerchantId", "ExternalId" },
                unique: true,
                filter: "\"ExternalId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CategoryProduct_ProductsId",
                table: "CategoryProduct",
                column: "ProductsId");

            migrationBuilder.CreateIndex(
                name: "IX_CheckoutConfigs_CheckoutId",
                table: "CheckoutConfigs",
                column: "CheckoutId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CheckoutCoupon_CouponsId",
                table: "CheckoutCoupon",
                column: "CouponsId");

            migrationBuilder.CreateIndex(
                name: "IX_CheckoutProducts_CheckoutId_ProductId_VariantId",
                table: "CheckoutProducts",
                columns: new[] { "CheckoutId", "ProductId", "VariantId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CheckoutProducts_ProductId",
                table: "CheckoutProducts",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_CheckoutProducts_VariantId",
                table: "CheckoutProducts",
                column: "VariantId");

            migrationBuilder.CreateIndex(
                name: "IX_Checkouts_CheckoutTemplateId",
                table: "Checkouts",
                column: "CheckoutTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_Checkouts_MerchantId_Slug_Environment",
                table: "Checkouts",
                columns: new[] { "MerchantId", "Slug", "Environment" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CouponProduct_ProductsId",
                table: "CouponProduct",
                column: "ProductsId");

            migrationBuilder.CreateIndex(
                name: "IX_Coupons_MerchantId_Code_Environment",
                table: "Coupons",
                columns: new[] { "MerchantId", "Code", "Environment" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Customers_MerchantId",
                table: "Customers",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_MerchantId_Document_Environment",
                table: "Customers",
                columns: new[] { "MerchantId", "Document", "Environment" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeviceVerificationCodes_CodeHash",
                table: "DeviceVerificationCodes",
                column: "CodeHash");

            migrationBuilder.CreateIndex(
                name: "IX_DeviceVerificationCodes_UserId",
                table: "DeviceVerificationCodes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailConfirmationTokens_TokenHash",
                table: "EmailConfirmationTokens",
                column: "TokenHash");

            migrationBuilder.CreateIndex(
                name: "IX_EmailConfirmationTokens_UserId",
                table: "EmailConfirmationTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_LedgerEntries_AccountId",
                table: "LedgerEntries",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_LedgerEntries_LedgerTransactionId",
                table: "LedgerEntries",
                column: "LedgerTransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_LedgerTransactions_PaymentId",
                table: "LedgerTransactions",
                column: "PaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_LedgerTransactions_PayoutId",
                table: "LedgerTransactions",
                column: "PayoutId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantAcquirers_AcquirerId",
                table: "MerchantAcquirers",
                column: "AcquirerId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantAcquirers_MerchantId",
                table: "MerchantAcquirers",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantApiCredentials_MerchantId",
                table: "MerchantApiCredentials",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantBalances_MerchantId",
                table: "MerchantBalances",
                column: "MerchantId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MerchantBalances_MerchantId_Environment",
                table: "MerchantBalances",
                columns: new[] { "MerchantId", "Environment" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MerchantDashboardCaches_MerchantId",
                table: "MerchantDashboardCaches",
                column: "MerchantId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MerchantDashboardCaches_MerchantId_Environment",
                table: "MerchantDashboardCaches",
                columns: new[] { "MerchantId", "Environment" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MerchantDeletionCodes_CodeHash",
                table: "MerchantDeletionCodes",
                column: "CodeHash");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantDeletionCodes_MerchantId",
                table: "MerchantDeletionCodes",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantDeletionCodes_UserId",
                table: "MerchantDeletionCodes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantKycPendingItems_MerchantId",
                table: "MerchantKycPendingItems",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantKycPendingItems_RequestedByUserId",
                table: "MerchantKycPendingItems",
                column: "RequestedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantKycs_DocumentBackFileId",
                table: "MerchantKycs",
                column: "DocumentBackFileId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantKycs_DocumentFrontFileId",
                table: "MerchantKycs",
                column: "DocumentFrontFileId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantKycs_MerchantId",
                table: "MerchantKycs",
                column: "MerchantId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MerchantKycs_ProofOfAddressFileId",
                table: "MerchantKycs",
                column: "ProofOfAddressFileId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantKycs_SelfieFileId",
                table: "MerchantKycs",
                column: "SelfieFileId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantPayoutAccounts_MerchantId",
                table: "MerchantPayoutAccounts",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_Merchants_UserId",
                table: "Merchants",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantSettings_MerchantId",
                table: "MerchantSettings",
                column: "MerchantId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_MerchantId",
                table: "Notifications",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_Scope_MerchantId_Environment_IsRead",
                table: "Notifications",
                columns: new[] { "Scope", "MerchantId", "Environment", "IsRead" });

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_Scope_UserId_IsRead",
                table: "Notifications",
                columns: new[] { "Scope", "UserId", "IsRead" });

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId",
                table: "Notifications",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordChangeCodes_CodeHash",
                table: "PasswordChangeCodes",
                column: "CodeHash");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordChangeCodes_UserId",
                table: "PasswordChangeCodes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetCodes_CodeHash",
                table: "PasswordResetCodes",
                column: "CodeHash");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetCodes_UserId",
                table: "PasswordResetCodes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentItems_PaymentId",
                table: "PaymentItems",
                column: "PaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentItems_ProductId",
                table: "PaymentItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentItems_VariantId",
                table: "PaymentItems",
                column: "VariantId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_CheckoutId",
                table: "Payments",
                column: "CheckoutId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_CouponId",
                table: "Payments",
                column: "CouponId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_CustomerId",
                table: "Payments",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_MerchantAcquirerId",
                table: "Payments",
                column: "MerchantAcquirerId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_MerchantId",
                table: "Payments",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_ProductId",
                table: "Payments",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_VariantId",
                table: "Payments",
                column: "VariantId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentsPix_PaymentId",
                table: "PaymentsPix",
                column: "PaymentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PayoutAccountVerificationCodes_CodeHash",
                table: "PayoutAccountVerificationCodes",
                column: "CodeHash");

            migrationBuilder.CreateIndex(
                name: "IX_PayoutAccountVerificationCodes_MerchantPayoutAccountId",
                table: "PayoutAccountVerificationCodes",
                column: "MerchantPayoutAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_PayoutAccountVerificationCodes_UserId",
                table: "PayoutAccountVerificationCodes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Payouts_EvaluatedById",
                table: "Payouts",
                column: "EvaluatedById");

            migrationBuilder.CreateIndex(
                name: "IX_Payouts_MerchantAcquirerId",
                table: "Payouts",
                column: "MerchantAcquirerId");

            migrationBuilder.CreateIndex(
                name: "IX_Payouts_MerchantId",
                table: "Payouts",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_Payouts_MerchantPayoutAccountId",
                table: "Payouts",
                column: "MerchantPayoutAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_MerchantId_ExternalId",
                table: "Products",
                columns: new[] { "MerchantId", "ExternalId" },
                unique: true,
                filter: "\"ExternalId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PushTokens_Token",
                table: "PushTokens",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PushTokens_UserId",
                table: "PushTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_ReplacedByTokenId",
                table: "RefreshTokens",
                column: "ReplacedByTokenId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_TokenHash",
                table: "RefreshTokens",
                column: "TokenHash");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId",
                table: "RefreshTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_StoredFiles_ObjectName",
                table: "StoredFiles",
                column: "ObjectName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StoredFiles_OwnerId",
                table: "StoredFiles",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_StoredFiles_UploaderId",
                table: "StoredFiles",
                column: "UploaderId");

            migrationBuilder.CreateIndex(
                name: "IX_TrustedDevices_DeviceId",
                table: "TrustedDevices",
                column: "DeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_TrustedDevices_UserId_DeviceId",
                table: "TrustedDevices",
                columns: new[] { "UserId", "DeviceId" });

            migrationBuilder.CreateIndex(
                name: "IX_UserNotificationPreferences_UserId",
                table: "UserNotificationPreferences",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Variants_ProductId_ExternalId",
                table: "Variants",
                columns: new[] { "ProductId", "ExternalId" },
                unique: true,
                filter: "\"ExternalId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AcquirerDashboardCaches");

            migrationBuilder.DropTable(
                name: "AdminDashboardCaches");

            migrationBuilder.DropTable(
                name: "ApiCredentialCodes");

            migrationBuilder.DropTable(
                name: "CategoryProduct");

            migrationBuilder.DropTable(
                name: "CheckoutConfigs");

            migrationBuilder.DropTable(
                name: "CheckoutCoupon");

            migrationBuilder.DropTable(
                name: "CheckoutProducts");

            migrationBuilder.DropTable(
                name: "CouponProduct");

            migrationBuilder.DropTable(
                name: "DeviceVerificationCodes");

            migrationBuilder.DropTable(
                name: "EmailConfirmationTokens");

            migrationBuilder.DropTable(
                name: "LedgerEntries");

            migrationBuilder.DropTable(
                name: "MerchantBalances");

            migrationBuilder.DropTable(
                name: "MerchantDashboardCaches");

            migrationBuilder.DropTable(
                name: "MerchantDeletionCodes");

            migrationBuilder.DropTable(
                name: "MerchantKycPendingItems");

            migrationBuilder.DropTable(
                name: "MerchantKycs");

            migrationBuilder.DropTable(
                name: "MerchantSettings");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "PasswordChangeCodes");

            migrationBuilder.DropTable(
                name: "PasswordResetCodes");

            migrationBuilder.DropTable(
                name: "PaymentItems");

            migrationBuilder.DropTable(
                name: "PaymentsPix");

            migrationBuilder.DropTable(
                name: "PayoutAccountVerificationCodes");

            migrationBuilder.DropTable(
                name: "PlatformSettings");

            migrationBuilder.DropTable(
                name: "PushTokens");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "TrustedDevices");

            migrationBuilder.DropTable(
                name: "UserNotificationPreferences");

            migrationBuilder.DropTable(
                name: "MerchantApiCredentials");

            migrationBuilder.DropTable(
                name: "Categories");

            migrationBuilder.DropTable(
                name: "Accounts");

            migrationBuilder.DropTable(
                name: "LedgerTransactions");

            migrationBuilder.DropTable(
                name: "StoredFiles");

            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "Payouts");

            migrationBuilder.DropTable(
                name: "Checkouts");

            migrationBuilder.DropTable(
                name: "Coupons");

            migrationBuilder.DropTable(
                name: "Customers");

            migrationBuilder.DropTable(
                name: "Variants");

            migrationBuilder.DropTable(
                name: "MerchantAcquirers");

            migrationBuilder.DropTable(
                name: "MerchantPayoutAccounts");

            migrationBuilder.DropTable(
                name: "CheckoutTemplates");

            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.DropTable(
                name: "Acquirers");

            migrationBuilder.DropTable(
                name: "Merchants");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
