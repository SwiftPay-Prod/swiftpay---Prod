using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddReferralCommissionPaymentAmountsSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "FeeAmount",
                table: "ReferralCommissionPayments",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "NetAmount",
                table: "ReferralCommissionPayments",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "RequestedAmount",
                table: "ReferralCommissionPayments",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<Guid>(
                name: "WithdrawalRequestId",
                table: "ReferralCommissionPayments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReferralCommissionPayments_WithdrawalRequestId",
                table: "ReferralCommissionPayments",
                column: "WithdrawalRequestId");

            migrationBuilder.AddForeignKey(
                name: "FK_ReferralCommissionPayments_ReferralCommissionWithdrawalRequ~",
                table: "ReferralCommissionPayments",
                column: "WithdrawalRequestId",
                principalTable: "ReferralCommissionWithdrawalRequests",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ReferralCommissionPayments_ReferralCommissionWithdrawalRequ~",
                table: "ReferralCommissionPayments");

            migrationBuilder.DropIndex(
                name: "IX_ReferralCommissionPayments_WithdrawalRequestId",
                table: "ReferralCommissionPayments");

            migrationBuilder.DropColumn(
                name: "FeeAmount",
                table: "ReferralCommissionPayments");

            migrationBuilder.DropColumn(
                name: "NetAmount",
                table: "ReferralCommissionPayments");

            migrationBuilder.DropColumn(
                name: "RequestedAmount",
                table: "ReferralCommissionPayments");

            migrationBuilder.DropColumn(
                name: "WithdrawalRequestId",
                table: "ReferralCommissionPayments");
        }
    }
}
