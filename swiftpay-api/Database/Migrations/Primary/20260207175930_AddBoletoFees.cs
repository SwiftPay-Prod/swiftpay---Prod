using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddBoletoFees : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "BoletoApiFeeFixed",
                table: "PlatformSettings",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<string>(
                name: "BoletoApiFeeMode",
                table: "PlatformSettings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "BoletoApiFeePercentage",
                table: "PlatformSettings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<long>(
                name: "BoletoCheckoutFeeFixed",
                table: "PlatformSettings",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<string>(
                name: "BoletoCheckoutFeeMode",
                table: "PlatformSettings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "BoletoCheckoutFeePercentage",
                table: "PlatformSettings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<long>(
                name: "BoletoApiFeeFixed",
                table: "MerchantSettings",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BoletoApiFeeMode",
                table: "MerchantSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BoletoApiFeePercentage",
                table: "MerchantSettings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "BoletoCheckoutFeeFixed",
                table: "MerchantSettings",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BoletoCheckoutFeeMode",
                table: "MerchantSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BoletoCheckoutFeePercentage",
                table: "MerchantSettings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "BoletoInFeeFixed",
                table: "MerchantAcquirers",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<string>(
                name: "BoletoInFeeMode",
                table: "MerchantAcquirers",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "BoletoInFeePercentage",
                table: "MerchantAcquirers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<long>(
                name: "BoletoInFeeFixed",
                table: "Acquirers",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<string>(
                name: "BoletoInFeeMode",
                table: "Acquirers",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "BoletoInFeePercentage",
                table: "Acquirers",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BoletoApiFeeFixed",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "BoletoApiFeeMode",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "BoletoApiFeePercentage",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "BoletoCheckoutFeeFixed",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "BoletoCheckoutFeeMode",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "BoletoCheckoutFeePercentage",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "BoletoApiFeeFixed",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "BoletoApiFeeMode",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "BoletoApiFeePercentage",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "BoletoCheckoutFeeFixed",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "BoletoCheckoutFeeMode",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "BoletoCheckoutFeePercentage",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "BoletoInFeeFixed",
                table: "MerchantAcquirers");

            migrationBuilder.DropColumn(
                name: "BoletoInFeeMode",
                table: "MerchantAcquirers");

            migrationBuilder.DropColumn(
                name: "BoletoInFeePercentage",
                table: "MerchantAcquirers");

            migrationBuilder.DropColumn(
                name: "BoletoInFeeFixed",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "BoletoInFeeMode",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "BoletoInFeePercentage",
                table: "Acquirers");
        }
    }
}
