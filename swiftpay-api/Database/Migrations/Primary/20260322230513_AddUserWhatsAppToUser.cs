using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddUserWhatsAppToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "WhatsApp",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BoletoReserveCompensationDays",
                table: "PlatformSettings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreditCardReserveCompensationDays",
                table: "PlatformSettings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PixReserveCompensationDays",
                table: "PlatformSettings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "BoletoReserveCompensationDays",
                table: "MerchantSettings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CreditCardReserveCompensationDays",
                table: "MerchantSettings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PixReserveCompensationDays",
                table: "MerchantSettings",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WhatsApp",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "BoletoReserveCompensationDays",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "CreditCardReserveCompensationDays",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "PixReserveCompensationDays",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "BoletoReserveCompensationDays",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "CreditCardReserveCompensationDays",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "PixReserveCompensationDays",
                table: "MerchantSettings");
        }
    }
}
