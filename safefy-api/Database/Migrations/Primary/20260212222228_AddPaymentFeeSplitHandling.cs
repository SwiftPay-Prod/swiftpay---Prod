using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddPaymentFeeSplitHandling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BoletoFeeSplitHandling",
                table: "MerchantAcquirers",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreditCardFeeSplitHandling",
                table: "MerchantAcquirers",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PixFeeSplitHandling",
                table: "MerchantAcquirers",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BoletoFeeSplitHandling",
                table: "Acquirers",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreditCardFeeSplitHandling",
                table: "Acquirers",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PixFeeSplitHandling",
                table: "Acquirers",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BoletoFeeSplitHandling",
                table: "MerchantAcquirers");

            migrationBuilder.DropColumn(
                name: "CreditCardFeeSplitHandling",
                table: "MerchantAcquirers");

            migrationBuilder.DropColumn(
                name: "PixFeeSplitHandling",
                table: "MerchantAcquirers");

            migrationBuilder.DropColumn(
                name: "BoletoFeeSplitHandling",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "CreditCardFeeSplitHandling",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "PixFeeSplitHandling",
                table: "Acquirers");
        }
    }
}
