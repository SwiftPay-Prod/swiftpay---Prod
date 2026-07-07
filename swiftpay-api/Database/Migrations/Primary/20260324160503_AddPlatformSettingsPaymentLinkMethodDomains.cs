using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddPlatformSettingsPaymentLinkMethodDomains : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BoletoPaymentLinkBaseUrl",
                table: "PlatformSettings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BoletoProxyBaseUrl",
                table: "PlatformSettings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreditCardPaymentLinkBaseUrl",
                table: "PlatformSettings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PixPaymentLinkBaseUrl",
                table: "PlatformSettings",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BoletoPaymentLinkBaseUrl",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "BoletoProxyBaseUrl",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "CreditCardPaymentLinkBaseUrl",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "PixPaymentLinkBaseUrl",
                table: "PlatformSettings");
        }
    }
}
