using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddPlatformPayoutLedgerIdempotencyIndexes : Migration
    {
        private const string IdempotencyCutoffUtc = "2026-03-15 18:04:15+00";

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_LedgerTransactions_PlatformPayoutId_NoItem_Operation_Unique",
                table: "LedgerTransactions",
                columns: new[] { "PlatformPayoutId", "PlatformPayoutItemId", "Operation" },
                unique: true,
                filter: $"\"PlatformPayoutId\" IS NOT NULL AND \"PlatformPayoutItemId\" IS NULL AND \"Operation\" = 'PlatformPayOut' AND \"CreatedAt\" >= TIMESTAMPTZ '{IdempotencyCutoffUtc}'");

            migrationBuilder.CreateIndex(
                name: "IX_LedgerTransactions_PlatformPayoutItemId_Operation_Unique",
                table: "LedgerTransactions",
                columns: new[] { "PlatformPayoutItemId", "Operation" },
                unique: true,
                filter: $"\"PlatformPayoutItemId\" IS NOT NULL AND \"Operation\" = 'PlatformPayOut' AND \"CreatedAt\" >= TIMESTAMPTZ '{IdempotencyCutoffUtc}'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_LedgerTransactions_PlatformPayoutId_NoItem_Operation_Unique",
                table: "LedgerTransactions");

            migrationBuilder.DropIndex(
                name: "IX_LedgerTransactions_PlatformPayoutItemId_Operation_Unique",
                table: "LedgerTransactions");
        }
    }
}
