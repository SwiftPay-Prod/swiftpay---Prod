using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class FixRankingSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"RankingSuspendedUntil\" timestamp with time zone;");
            migrationBuilder.Sql("ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"RankingSuspensionReason\" text;");

            migrationBuilder.Sql("DELETE FROM \"UserRankingCaches\";");

            migrationBuilder.DropForeignKey(
                name: "FK_UserRankingCaches_Merchants_MerchantId",
                table: "UserRankingCaches");

            migrationBuilder.DropIndex(
                name: "IX_UserRankingCaches_MerchantId_Period_Environment",
                table: "UserRankingCaches");

            migrationBuilder.DropIndex(
                name: "IX_UserRankingCaches_UserId_Period_Environment",
                table: "UserRankingCaches");

            migrationBuilder.DropColumn(
                name: "MerchantId",
                table: "UserRankingCaches");

            migrationBuilder.DropColumn(
                name: "MerchantName",
                table: "UserRankingCaches");

            migrationBuilder.CreateIndex(
                name: "IX_UserRankingCaches_UserId_Period_Environment",
                table: "UserRankingCaches",
                columns: new[] { "UserId", "Period", "Environment" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserRankingCaches_UserId_Period_Environment",
                table: "UserRankingCaches");

            migrationBuilder.DropColumn(
                name: "RankingSuspendedUntil",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "RankingSuspensionReason",
                table: "Users");

            migrationBuilder.AddColumn<Guid>(
                name: "MerchantId",
                table: "UserRankingCaches",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "MerchantName",
                table: "UserRankingCaches",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_UserRankingCaches_UserId_Period_Environment",
                table: "UserRankingCaches",
                columns: new[] { "UserId", "Period", "Environment" });

            migrationBuilder.CreateIndex(
                name: "IX_UserRankingCaches_MerchantId_Period_Environment",
                table: "UserRankingCaches",
                columns: new[] { "MerchantId", "Period", "Environment" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_UserRankingCaches_Merchants_MerchantId",
                table: "UserRankingCaches",
                column: "MerchantId",
                principalTable: "Merchants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
