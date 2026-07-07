using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddPaymentLinkFeeSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "BoletoPaymentLinkFeeFixed",
                table: "PlatformSettings",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<string>(
                name: "BoletoPaymentLinkFeeMode",
                table: "PlatformSettings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "BoletoPaymentLinkFeePercentage",
                table: "PlatformSettings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<long>(
                name: "PixPaymentLinkFeeFixed",
                table: "PlatformSettings",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<string>(
                name: "PixPaymentLinkFeeMode",
                table: "PlatformSettings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "PixPaymentLinkFeePercentage",
                table: "PlatformSettings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<long>(
                name: "BoletoPaymentLinkFeeFixed",
                table: "MerchantSettings",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BoletoPaymentLinkFeeMode",
                table: "MerchantSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BoletoPaymentLinkFeePercentage",
                table: "MerchantSettings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "PixPaymentLinkFeeFixed",
                table: "MerchantSettings",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PixPaymentLinkFeeMode",
                table: "MerchantSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PixPaymentLinkFeePercentage",
                table: "MerchantSettings",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BoletoPaymentLinkFeeFixed",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "BoletoPaymentLinkFeeMode",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "BoletoPaymentLinkFeePercentage",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "PixPaymentLinkFeeFixed",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "PixPaymentLinkFeeMode",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "PixPaymentLinkFeePercentage",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "BoletoPaymentLinkFeeFixed",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "BoletoPaymentLinkFeeMode",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "BoletoPaymentLinkFeePercentage",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "PixPaymentLinkFeeFixed",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "PixPaymentLinkFeeMode",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "PixPaymentLinkFeePercentage",
                table: "MerchantSettings");
        }
    }
}
