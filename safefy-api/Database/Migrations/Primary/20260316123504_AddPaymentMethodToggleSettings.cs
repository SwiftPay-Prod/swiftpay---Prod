using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddPaymentMethodToggleSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "BoletoEnabled",
                table: "PlatformSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CreditCardEnabled",
                table: "PlatformSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PixEnabled",
                table: "PlatformSettings",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "WithdrawalEnabled",
                table: "PlatformSettings",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "BoletoEnabled",
                table: "MerchantSettings",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "CreditCardEnabled",
                table: "MerchantSettings",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PixEnabled",
                table: "MerchantSettings",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "WithdrawalEnabled",
                table: "MerchantSettings",
                type: "boolean",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BoletoEnabled",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "CreditCardEnabled",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "PixEnabled",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "WithdrawalEnabled",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "BoletoEnabled",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "CreditCardEnabled",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "PixEnabled",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "WithdrawalEnabled",
                table: "MerchantSettings");
        }
    }
}
