using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddPlatformPayoutIdToLedgerTransactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PlatformPayoutId",
                table: "LedgerTransactions",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_LedgerTransactions_PlatformPayoutId",
                table: "LedgerTransactions",
                column: "PlatformPayoutId");

            migrationBuilder.AddForeignKey(
                name: "FK_LedgerTransactions_PlatformPayouts_PlatformPayoutId",
                table: "LedgerTransactions",
                column: "PlatformPayoutId",
                principalTable: "PlatformPayouts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LedgerTransactions_PlatformPayouts_PlatformPayoutId",
                table: "LedgerTransactions");

            migrationBuilder.DropIndex(
                name: "IX_LedgerTransactions_PlatformPayoutId",
                table: "LedgerTransactions");

            migrationBuilder.DropColumn(
                name: "PlatformPayoutId",
                table: "LedgerTransactions");
        }
    }
}
