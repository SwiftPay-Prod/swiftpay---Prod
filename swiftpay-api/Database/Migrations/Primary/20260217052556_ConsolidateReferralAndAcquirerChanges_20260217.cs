using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class ConsolidateReferralAndAcquirerChanges_20260217 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MerchantAcquirers_MerchantId",
                table: "MerchantAcquirers");

            migrationBuilder.DropIndex(
                name: "IX_Accounts_MerchantId_Type_Environment",
                table: "Accounts");

            migrationBuilder.AddColumn<string>(
                name: "ReferralCode",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReferralCommissionPercentage",
                table: "Users",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReferralDurationMonths",
                table: "Users",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferralPayoutPixKey",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferralPayoutPixKeyType",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReferredAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReferredByUserId",
                table: "Users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReferralCommissionPercentage",
                table: "PlatformSettings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ReferralDurationMonths",
                table: "PlatformSettings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "ActivatedAt",
                table: "MerchantAcquirers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "MerchantAcquirerId",
                table: "Accounts",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ReferralCommissionPayments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReferrerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    PaidByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Amount = table.Column<long>(type: "bigint", nullable: false),
                    PixKeyType = table.Column<string>(type: "text", nullable: true),
                    PixKey = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    LedgerTransactionId = table.Column<string>(type: "text", nullable: true),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReferralCommissionPayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReferralCommissionPayments_LedgerTransactions_LedgerTransac~",
                        column: x => x.LedgerTransactionId,
                        principalTable: "LedgerTransactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ReferralCommissionPayments_Users_PaidByUserId",
                        column: x => x.PaidByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReferralCommissionPayments_Users_ReferrerUserId",
                        column: x => x.ReferrerUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_ReferralCode",
                table: "Users",
                column: "ReferralCode",
                unique: true,
                filter: "\"ReferralCode\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Users_ReferredByUserId",
                table: "Users",
                column: "ReferredByUserId");

            migrationBuilder.Sql(@"
                WITH ranked AS (
                    SELECT
                        ma.""Id"",
                        ROW_NUMBER() OVER (
                            PARTITION BY ma.""MerchantId""
                            ORDER BY COALESCE(ma.""ActivatedAt"", ma.""UpdatedAt"", ma.""CreatedAt"") DESC,
                                     ma.""CreatedAt"" DESC,
                                     ma.""Id"" DESC
                        ) AS rn
                    FROM ""MerchantAcquirers"" ma
                    WHERE ma.""IsActive"" = TRUE
                )
                UPDATE ""MerchantAcquirers"" ma
                SET ""IsActive"" = FALSE,
                    ""IsDefault"" = FALSE,
                    ""UpdatedAt"" = NOW()
                FROM ranked r
                WHERE ma.""Id"" = r.""Id""
                  AND r.rn > 1;

                UPDATE ""MerchantAcquirers""
                SET ""IsDefault"" = ""IsActive""
                WHERE ""IsDefault"" IS DISTINCT FROM ""IsActive"";
            ");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantAcquirers_MerchantId",
                table: "MerchantAcquirers",
                column: "MerchantId",
                unique: true,
                filter: "\"IsActive\" = TRUE");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantAcquirers_MerchantId_AcquirerId",
                table: "MerchantAcquirers",
                columns: new[] { "MerchantId", "AcquirerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_MerchantAcquirerId",
                table: "Accounts",
                column: "MerchantAcquirerId");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_MerchantId_Type_Environment_Legacy",
                table: "Accounts",
                columns: new[] { "MerchantId", "Type", "Environment" });

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_MerchantId_Type_Environment_MerchantAcquirerId",
                table: "Accounts",
                columns: new[] { "MerchantId", "Type", "Environment", "MerchantAcquirerId" },
                unique: true,
                filter: "\"MerchantId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ReferralCommissionPayments_LedgerTransactionId",
                table: "ReferralCommissionPayments",
                column: "LedgerTransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_ReferralCommissionPayments_PaidByUserId",
                table: "ReferralCommissionPayments",
                column: "PaidByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ReferralCommissionPayments_ReferrerUserId",
                table: "ReferralCommissionPayments",
                column: "ReferrerUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Accounts_MerchantAcquirers_MerchantAcquirerId",
                table: "Accounts",
                column: "MerchantAcquirerId",
                principalTable: "MerchantAcquirers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Users_ReferredByUserId",
                table: "Users",
                column: "ReferredByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Accounts_MerchantAcquirers_MerchantAcquirerId",
                table: "Accounts");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Users_ReferredByUserId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "ReferralCommissionPayments");

            migrationBuilder.DropIndex(
                name: "IX_Users_ReferralCode",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_ReferredByUserId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_MerchantAcquirers_MerchantId",
                table: "MerchantAcquirers");

            migrationBuilder.DropIndex(
                name: "IX_MerchantAcquirers_MerchantId_AcquirerId",
                table: "MerchantAcquirers");

            migrationBuilder.DropIndex(
                name: "IX_Accounts_MerchantAcquirerId",
                table: "Accounts");

            migrationBuilder.DropIndex(
                name: "IX_Accounts_MerchantId_Type_Environment_Legacy",
                table: "Accounts");

            migrationBuilder.DropIndex(
                name: "IX_Accounts_MerchantId_Type_Environment_MerchantAcquirerId",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "ReferralCode",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ReferralCommissionPercentage",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ReferralDurationMonths",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ReferralPayoutPixKey",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ReferralPayoutPixKeyType",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ReferredAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ReferredByUserId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ReferralCommissionPercentage",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "ReferralDurationMonths",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "ActivatedAt",
                table: "MerchantAcquirers");

            migrationBuilder.DropColumn(
                name: "MerchantAcquirerId",
                table: "Accounts");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantAcquirers_MerchantId",
                table: "MerchantAcquirers",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_MerchantId_Type_Environment",
                table: "Accounts",
                columns: new[] { "MerchantId", "Type", "Environment" },
                unique: true,
                filter: "\"MerchantId\" IS NOT NULL");
        }
    }
}
