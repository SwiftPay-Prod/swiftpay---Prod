using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class RemoveCheckoutTemplateExpirationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExpiresAfterMinutes",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "HasExpiration",
                table: "CheckoutTemplates");

            migrationBuilder.DropColumn(
                name: "MaxPayments",
                table: "CheckoutTemplates");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ExpiresAfterMinutes",
                table: "CheckoutTemplates",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasExpiration",
                table: "CheckoutTemplates",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "MaxPayments",
                table: "CheckoutTemplates",
                type: "integer",
                nullable: true);
        }
    }
}
