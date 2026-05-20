using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddPaymentBoletoPixHybridFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PixCopyAndPaste",
                table: "PaymentsBoleto",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PixExpiresAt",
                table: "PaymentsBoleto",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PixQrCode",
                table: "PaymentsBoleto",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecipientDocument",
                table: "PaymentsBoleto",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecipientName",
                table: "PaymentsBoleto",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PixCopyAndPaste",
                table: "PaymentsBoleto");

            migrationBuilder.DropColumn(
                name: "PixExpiresAt",
                table: "PaymentsBoleto");

            migrationBuilder.DropColumn(
                name: "PixQrCode",
                table: "PaymentsBoleto");

            migrationBuilder.DropColumn(
                name: "RecipientDocument",
                table: "PaymentsBoleto");

            migrationBuilder.DropColumn(
                name: "RecipientName",
                table: "PaymentsBoleto");
        }
    }
}
