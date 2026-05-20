using System;
using Microsoft.EntityFrameworkCore.Migrations;
using safefy_api_core.Models.Database;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class CheckoutsOrdersAndEnhancements_20260126 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Checkouts_CheckoutTemplates_CheckoutTemplateId",
                table: "Checkouts");

            migrationBuilder.DropForeignKey(
                name: "FK_CouponProduct_Coupons_CouponId",
                table: "CouponProduct");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Checkouts_CheckoutId",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Coupons_CouponId",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Products_ProductId",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Variants_VariantId",
                table: "Payments");

            migrationBuilder.DropTable(
                name: "PaymentItems");

            migrationBuilder.DropIndex(
                name: "IX_Payments_CheckoutId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_CouponId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_ProductId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_VariantId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Checkouts_MerchantId_Slug_Environment",
                table: "Checkouts");

            migrationBuilder.DropColumn(
                name: "CheckoutId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "CouponId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "DiscountAmount",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ProductId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ShippingAmount",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "SubtotalAmount",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "MicrosoftClarityCode",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "MicrosoftClarityIsEnabled",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "BackgroundColor",
                table: "CheckoutConfigs");

            migrationBuilder.RenameColumn(
                name: "VariantId",
                table: "Payments",
                newName: "OrderId");

            migrationBuilder.RenameColumn(
                name: "CouponId",
                table: "CouponProduct",
                newName: "CouponsId");

            migrationBuilder.RenameColumn(
                name: "SupportsMultipleProducts",
                table: "CheckoutTemplates",
                newName: "SupportsUtmify");

            migrationBuilder.RenameColumn(
                name: "PreviewImageUrl",
                table: "CheckoutTemplates",
                newName: "ThumbnailUrl");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "CheckoutTemplates",
                newName: "BestFor");

            migrationBuilder.RenameColumn(
                name: "AllowQuantityChange",
                table: "CheckoutConfigs",
                newName: "SocialProofEnabled");

            migrationBuilder.AddColumn<bool>(
                name: "IsProcessingWebhook",
                table: "Payments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "WebhookProcessingStartedAt",
                table: "Payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ActiveCheckouts",
                table: "CheckoutTemplates",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "CheckoutTemplates",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "ExpiresAfterMinutes",
                table: "CheckoutTemplates",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Features",
                table: "CheckoutTemplates",
                type: "jsonb",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<long>(
                name: "FeeFixed",
                table: "CheckoutTemplates",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<string>(
                name: "FeeMode",
                table: "CheckoutTemplates",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FeePercentage",
                table: "CheckoutTemplates",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "FullDescription",
                table: "CheckoutTemplates",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxPayments",
                table: "CheckoutTemplates",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreviewImages",
                table: "CheckoutTemplates",
                type: "jsonb",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "ShortDescription",
                table: "CheckoutTemplates",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "SupportsClarity",
                table: "CheckoutTemplates",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SupportsFacebookPixel",
                table: "CheckoutTemplates",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SupportsGoogleTagManager",
                table: "CheckoutTemplates",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SupportsKwai",
                table: "CheckoutTemplates",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SupportsOtimizey",
                table: "CheckoutTemplates",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SupportsPinterest",
                table: "CheckoutTemplates",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SupportsSocialProof",
                table: "CheckoutTemplates",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SupportsTaboola",
                table: "CheckoutTemplates",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SupportsTikTok",
                table: "CheckoutTemplates",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SupportsTimer",
                table: "CheckoutTemplates",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<Guid>(
                name: "CheckoutTemplateId",
                table: "Checkouts",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "ShortId",
                table: "Checkouts",
                type: "character varying(12)",
                maxLength: 12,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ColorMode",
                table: "CheckoutConfigs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DefaultPaymentMethod",
                table: "CheckoutConfigs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "FixedShippingAmount",
                table: "CheckoutConfigs",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "RequireCustomerPhone",
                table: "CheckoutConfigs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ShowTimer",
                table: "CheckoutConfigs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SocialProofSettings",
                table: "CheckoutConfigs",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SubHeaderMessage",
                table: "CheckoutConfigs",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TimerExpiredText",
                table: "CheckoutConfigs",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TimerMinutes",
                table: "CheckoutConfigs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TimerText",
                table: "CheckoutConfigs",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TrackingSettings",
                table: "CheckoutConfigs",
                type: "jsonb",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BankReconciliations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    RequestedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    LedgerBalance = table.Column<long>(type: "bigint", nullable: false),
                    CurrentBalance = table.Column<long>(type: "bigint", nullable: false),
                    CalculatedBalance = table.Column<long>(type: "bigint", nullable: false),
                    BalanceDifference = table.Column<long>(type: "bigint", nullable: false),
                    TotalPaymentsAmount = table.Column<long>(type: "bigint", nullable: false),
                    TotalPaymentsCount = table.Column<int>(type: "integer", nullable: false),
                    TotalFeesAmount = table.Column<long>(type: "bigint", nullable: false),
                    TotalPayoutsAmount = table.Column<long>(type: "bigint", nullable: false),
                    TotalPayoutsCount = table.Column<int>(type: "integer", nullable: false),
                    TotalRefundsAmount = table.Column<long>(type: "bigint", nullable: false),
                    TotalRefundsCount = table.Column<int>(type: "integer", nullable: false),
                    TotalAdjustmentsAmount = table.Column<long>(type: "bigint", nullable: false),
                    TotalAdjustmentsCount = table.Column<int>(type: "integer", nullable: false),
                    TotalLedgerTransactionsCount = table.Column<int>(type: "integer", nullable: false),
                    HasDiscrepancies = table.Column<bool>(type: "boolean", nullable: false),
                    TotalDiscrepancies = table.Column<int>(type: "integer", nullable: false),
                    DiscrepanciesCount = table.Column<int>(type: "integer", nullable: false),
                    DiscrepanciesTotalAmount = table.Column<long>(type: "bigint", nullable: false),
                    DiscrepanciesWithErrorAmount = table.Column<long>(type: "bigint", nullable: false),
                    CorrectionsApplied = table.Column<bool>(type: "boolean", nullable: false),
                    CorrectionsAppliedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CorrectionsAppliedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CorrectionNotes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ProcessingStartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ProcessingCompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BankReconciliations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BankReconciliations_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BankReconciliations_Users_CorrectionsAppliedByUserId",
                        column: x => x.CorrectionsAppliedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_BankReconciliations_Users_RequestedByUserId",
                        column: x => x.RequestedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Orders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    CheckoutId = table.Column<Guid>(type: "uuid", nullable: true),
                    CouponId = table.Column<Guid>(type: "uuid", nullable: true),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    FulfillmentStatus = table.Column<string>(type: "text", nullable: false),
                    SubtotalAmount = table.Column<long>(type: "bigint", nullable: false),
                    DiscountAmount = table.Column<long>(type: "bigint", nullable: false),
                    ShippingAmount = table.Column<long>(type: "bigint", nullable: false),
                    TotalAmount = table.Column<long>(type: "bigint", nullable: false),
                    CouponCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ShippingAddress = table.Column<OrderShippingAddress>(type: "jsonb", nullable: true),
                    OrderNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Orders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Orders_Checkouts_CheckoutId",
                        column: x => x.CheckoutId,
                        principalTable: "Checkouts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Orders_Coupons_CouponId",
                        column: x => x.CouponId,
                        principalTable: "Coupons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Orders_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Orders_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BankReconciliationDiscrepancies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BankReconciliationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Severity = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    SuggestedAction = table.Column<string>(type: "text", nullable: true),
                    PaymentId = table.Column<Guid>(type: "uuid", nullable: true),
                    PayoutId = table.Column<Guid>(type: "uuid", nullable: true),
                    LedgerTransactionId = table.Column<string>(type: "text", nullable: true),
                    ExpectedAmount = table.Column<long>(type: "bigint", nullable: false),
                    ActualAmount = table.Column<long>(type: "bigint", nullable: false),
                    Difference = table.Column<long>(type: "bigint", nullable: false),
                    Corrected = table.Column<bool>(type: "boolean", nullable: false),
                    CorrectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CorrectionDescription = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BankReconciliationDiscrepancies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BankReconciliationDiscrepancies_BankReconciliations_BankRec~",
                        column: x => x.BankReconciliationId,
                        principalTable: "BankReconciliations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BankReconciliationDiscrepancies_LedgerTransactions_LedgerTr~",
                        column: x => x.LedgerTransactionId,
                        principalTable: "LedgerTransactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_BankReconciliationDiscrepancies_Payments_PaymentId",
                        column: x => x.PaymentId,
                        principalTable: "Payments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_BankReconciliationDiscrepancies_Payouts_PayoutId",
                        column: x => x.PayoutId,
                        principalTable: "Payouts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "OrderItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    VariantId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProductName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    VariantName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Sku = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    UnitPrice = table.Column<long>(type: "bigint", nullable: false),
                    TotalPrice = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderItems_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrderItems_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrderItems_Variants_VariantId",
                        column: x => x.VariantId,
                        principalTable: "Variants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Payments_OrderId",
                table: "Payments",
                column: "OrderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Checkouts_MerchantId",
                table: "Checkouts",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_Checkouts_Slug",
                table: "Checkouts",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BankReconciliationDiscrepancies_BankReconciliationId",
                table: "BankReconciliationDiscrepancies",
                column: "BankReconciliationId");

            migrationBuilder.CreateIndex(
                name: "IX_BankReconciliationDiscrepancies_LedgerTransactionId",
                table: "BankReconciliationDiscrepancies",
                column: "LedgerTransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_BankReconciliationDiscrepancies_PaymentId",
                table: "BankReconciliationDiscrepancies",
                column: "PaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_BankReconciliationDiscrepancies_PayoutId",
                table: "BankReconciliationDiscrepancies",
                column: "PayoutId");

            migrationBuilder.CreateIndex(
                name: "IX_BankReconciliations_CorrectionsAppliedByUserId",
                table: "BankReconciliations",
                column: "CorrectionsAppliedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_BankReconciliations_MerchantId_Environment",
                table: "BankReconciliations",
                columns: new[] { "MerchantId", "Environment" });

            migrationBuilder.CreateIndex(
                name: "IX_BankReconciliations_RequestedByUserId",
                table: "BankReconciliations",
                column: "RequestedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_BankReconciliations_Status",
                table: "BankReconciliations",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_OrderId",
                table: "OrderItems",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_ProductId",
                table: "OrderItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_VariantId",
                table: "OrderItems",
                column: "VariantId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_CheckoutId",
                table: "Orders",
                column: "CheckoutId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_CouponId",
                table: "Orders",
                column: "CouponId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_CustomerId",
                table: "Orders",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_MerchantId",
                table: "Orders",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_MerchantId_Environment",
                table: "Orders",
                columns: new[] { "MerchantId", "Environment" });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_MerchantId_OrderNumber_Environment",
                table: "Orders",
                columns: new[] { "MerchantId", "OrderNumber", "Environment" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Checkouts_CheckoutTemplates_CheckoutTemplateId",
                table: "Checkouts",
                column: "CheckoutTemplateId",
                principalTable: "CheckoutTemplates",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CouponProduct_Coupons_CouponsId",
                table: "CouponProduct",
                column: "CouponsId",
                principalTable: "Coupons",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Orders_OrderId",
                table: "Payments",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Checkouts_CheckoutTemplates_CheckoutTemplateId",
                table: "Checkouts");

            migrationBuilder.DropForeignKey(
                name: "FK_CouponProduct_Coupons_CouponsId",
                table: "CouponProduct");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Orders_OrderId",
                table: "Payments");

            migrationBuilder.DropTable(
                name: "BankReconciliationDiscrepancies");

            migrationBuilder.DropTable(
                name: "OrderItems");

            migrationBuilder.DropTable(
                name: "BankReconciliations");

            migrationBuilder.DropTable(
                name: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Payments_OrderId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Checkouts_MerchantId",
                table: "Checkouts");

            migrationBuilder.DropIndex(
                name: "IX_Checkouts_Slug",
                table: "Checkouts");

            migrationBuilder.DropColumn(
                name: "IsProcessingWebhook",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "WebhookProcessingStartedAt",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ActiveCheckouts",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "ExpiresAfterMinutes",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "Features",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "FeeFixed",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "FeeMode",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "FeePercentage",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "FullDescription",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "MaxPayments",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "PreviewImages",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "ShortDescription",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "SupportsClarity",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "SupportsFacebookPixel",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "SupportsGoogleTagManager",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "SupportsKwai",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "SupportsOtimizey",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "SupportsPinterest",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "SupportsSocialProof",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "SupportsTaboola",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "SupportsTikTok",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "SupportsTimer",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "ShortId",
                table: "Checkouts");

            migrationBuilder.DropColumn(
                name: "ColorMode",
                table: "CheckoutConfigs");

            migrationBuilder.DropColumn(
                name: "DefaultPaymentMethod",
                table: "CheckoutConfigs");

            migrationBuilder.DropColumn(
                name: "FixedShippingAmount",
                table: "CheckoutConfigs");

            migrationBuilder.DropColumn(
                name: "RequireCustomerPhone",
                table: "CheckoutConfigs");

            migrationBuilder.DropColumn(
                name: "ShowTimer",
                table: "CheckoutConfigs");

            migrationBuilder.DropColumn(
                name: "SocialProofSettings",
                table: "CheckoutConfigs");

            migrationBuilder.DropColumn(
                name: "SubHeaderMessage",
                table: "CheckoutConfigs");

            migrationBuilder.DropColumn(
                name: "TimerExpiredText",
                table: "CheckoutConfigs");

            migrationBuilder.DropColumn(
                name: "TimerMinutes",
                table: "CheckoutConfigs");

            migrationBuilder.DropColumn(
                name: "TimerText",
                table: "CheckoutConfigs");

            migrationBuilder.DropColumn(
                name: "TrackingSettings",
                table: "CheckoutConfigs");

            migrationBuilder.RenameColumn(
                name: "OrderId",
                table: "Payments",
                newName: "VariantId");

            migrationBuilder.RenameColumn(
                name: "CouponsId",
                table: "CouponProduct",
                newName: "CouponId");

            migrationBuilder.RenameColumn(
                name: "ThumbnailUrl",
                table: "CheckoutTemplates",
                newName: "PreviewImageUrl");

            migrationBuilder.RenameColumn(
                name: "SupportsUtmify",
                table: "CheckoutTemplates",
                newName: "SupportsMultipleProducts");

            migrationBuilder.RenameColumn(
                name: "BestFor",
                table: "CheckoutTemplates",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "SocialProofEnabled",
                table: "CheckoutConfigs",
                newName: "AllowQuantityChange");

            migrationBuilder.AddColumn<Guid>(
                name: "CheckoutId",
                table: "Payments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CouponId",
                table: "Payments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "DiscountAmount",
                table: "Payments",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<Guid>(
                name: "ProductId",
                table: "Payments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "ShippingAmount",
                table: "Payments",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "SubtotalAmount",
                table: "Payments",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<string>(
                name: "MicrosoftClarityCode",
                table: "MerchantSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "MicrosoftClarityIsEnabled",
                table: "MerchantSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<Guid>(
                name: "CheckoutTemplateId",
                table: "Checkouts",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BackgroundColor",
                table: "CheckoutConfigs",
                type: "character varying(7)",
                maxLength: 7,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PaymentItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PaymentId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    VariantId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    TotalAmount = table.Column<long>(type: "bigint", nullable: false),
                    UnitPrice = table.Column<long>(type: "bigint", nullable: false),
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

            migrationBuilder.CreateIndex(
                name: "IX_Payments_CheckoutId",
                table: "Payments",
                column: "CheckoutId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_CouponId",
                table: "Payments",
                column: "CouponId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_ProductId",
                table: "Payments",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_VariantId",
                table: "Payments",
                column: "VariantId");

            migrationBuilder.CreateIndex(
                name: "IX_Checkouts_MerchantId_Slug_Environment",
                table: "Checkouts",
                columns: new[] { "MerchantId", "Slug", "Environment" },
                unique: true);

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

            migrationBuilder.AddForeignKey(
                name: "FK_Checkouts_CheckoutTemplates_CheckoutTemplateId",
                table: "Checkouts",
                column: "CheckoutTemplateId",
                principalTable: "CheckoutTemplates",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CouponProduct_Coupons_CouponId",
                table: "CouponProduct",
                column: "CouponId",
                principalTable: "Coupons",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Checkouts_CheckoutId",
                table: "Payments",
                column: "CheckoutId",
                principalTable: "Checkouts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Coupons_CouponId",
                table: "Payments",
                column: "CouponId",
                principalTable: "Coupons",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Products_ProductId",
                table: "Payments",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Variants_VariantId",
                table: "Payments",
                column: "VariantId",
                principalTable: "Variants",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
