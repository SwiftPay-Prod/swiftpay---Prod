using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class FixPendingModelChanges_20260217 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ReferralCodeCreatedAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReferralCommissionWithdrawalCooldownHours",
                table: "Users",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReferralPayoutPixKeyVerificationCodeExpiresAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReferralPayoutPixKeyVerificationCodeFailedAttempts",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ReferralPayoutPixKeyVerificationCodeHash",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReferralPayoutPixKeyVerificationCodeRequestedAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReferralPayoutPixKeyVerificationId",
                table: "Users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReferralCommissionWithdrawalCooldownHours",
                table: "PlatformSettings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ReferralCommissionWithdrawalRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReferrerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Amount = table.Column<long>(type: "bigint", nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReferralCommissionWithdrawalRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReferralCommissionWithdrawalRequests_Users_ReferrerUserId",
                        column: x => x.ReferrerUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReferralCommissionWithdrawalRequests_ReferrerUserId",
                table: "ReferralCommissionWithdrawalRequests",
                column: "ReferrerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ReferralCommissionWithdrawalRequests_RequestedAt",
                table: "ReferralCommissionWithdrawalRequests",
                column: "RequestedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReferralCommissionWithdrawalRequests");

            migrationBuilder.DropColumn(
                name: "ReferralCodeCreatedAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ReferralCommissionWithdrawalCooldownHours",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ReferralPayoutPixKeyVerificationCodeExpiresAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ReferralPayoutPixKeyVerificationCodeFailedAttempts",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ReferralPayoutPixKeyVerificationCodeHash",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ReferralPayoutPixKeyVerificationCodeRequestedAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ReferralPayoutPixKeyVerificationId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ReferralCommissionWithdrawalCooldownHours",
                table: "PlatformSettings");
        }
    }
}
