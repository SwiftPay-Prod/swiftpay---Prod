using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddReferralCommissionPaymentReceiptFile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ReceiptFileId",
                table: "ReferralCommissionPayments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReferralCommissionPayments_ReceiptFileId",
                table: "ReferralCommissionPayments",
                column: "ReceiptFileId");

            migrationBuilder.AddForeignKey(
                name: "FK_ReferralCommissionPayments_StoredFiles_ReceiptFileId",
                table: "ReferralCommissionPayments",
                column: "ReceiptFileId",
                principalTable: "StoredFiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ReferralCommissionPayments_StoredFiles_ReceiptFileId",
                table: "ReferralCommissionPayments");

            migrationBuilder.DropIndex(
                name: "IX_ReferralCommissionPayments_ReceiptFileId",
                table: "ReferralCommissionPayments");

            migrationBuilder.DropColumn(
                name: "ReceiptFileId",
                table: "ReferralCommissionPayments");
        }
    }
}
