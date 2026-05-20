using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class FixPlatformBalance_20260206 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "LedgerTransactions"
                    DROP CONSTRAINT IF EXISTS "FK_LedgerTransactions_PlatformPayouts_PlatformPayoutId";

                DROP TABLE IF EXISTS "PlatformPayouts";
                DROP TABLE IF EXISTS "PlatformPayoutAccounts";

                DROP INDEX IF EXISTS "IX_LedgerTransactions_PlatformPayoutId";

                ALTER TABLE "LedgerTransactions"
                    DROP COLUMN IF EXISTS "PlatformPayoutId";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PlatformPayoutId",
                table: "LedgerTransactions",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PlatformPayoutAccounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: false),
                    BankIspb = table.Column<string>(type: "text", nullable: true),
                    BankName = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    HolderDocument = table.Column<string>(type: "text", nullable: true),
                    HolderName = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    Label = table.Column<string>(type: "text", nullable: false),
                    PixKey = table.Column<string>(type: "text", nullable: false),
                    PixKeyType = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformPayoutAccounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlatformPayoutAccounts_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlatformPayouts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AcquirerId = table.Column<Guid>(type: "uuid", nullable: false),
                    PlatformPayoutAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestedById = table.Column<Guid>(type: "uuid", nullable: false),
                    AcquirerFee = table.Column<long>(type: "bigint", nullable: false),
                    AcquirerPayoutId = table.Column<string>(type: "text", nullable: true),
                    AcquirerStatus = table.Column<string>(type: "text", nullable: true),
                    AcquirerTransactionId = table.Column<string>(type: "text", nullable: true),
                    Amount = table.Column<long>(type: "bigint", nullable: false),
                    BatchId = table.Column<Guid>(type: "uuid", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    FailureReason = table.Column<string>(type: "text", nullable: true),
                    NetAmount = table.Column<long>(type: "bigint", nullable: false),
                    PixEndToEndId = table.Column<string>(type: "text", nullable: true),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformPayouts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlatformPayouts_Acquirers_AcquirerId",
                        column: x => x.AcquirerId,
                        principalTable: "Acquirers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlatformPayouts_PlatformPayoutAccounts_PlatformPayoutAccoun~",
                        column: x => x.PlatformPayoutAccountId,
                        principalTable: "PlatformPayoutAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlatformPayouts_Users_RequestedById",
                        column: x => x.RequestedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LedgerTransactions_PlatformPayoutId",
                table: "LedgerTransactions",
                column: "PlatformPayoutId");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformPayoutAccounts_CreatedById",
                table: "PlatformPayoutAccounts",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformPayouts_AcquirerId",
                table: "PlatformPayouts",
                column: "AcquirerId");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformPayouts_BatchId",
                table: "PlatformPayouts",
                column: "BatchId");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformPayouts_PlatformPayoutAccountId",
                table: "PlatformPayouts",
                column: "PlatformPayoutAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformPayouts_RequestedById",
                table: "PlatformPayouts",
                column: "RequestedById");

            migrationBuilder.AddForeignKey(
                name: "FK_LedgerTransactions_PlatformPayouts_PlatformPayoutId",
                table: "LedgerTransactions",
                column: "PlatformPayoutId",
                principalTable: "PlatformPayouts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
