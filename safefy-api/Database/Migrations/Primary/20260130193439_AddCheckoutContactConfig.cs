using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddCheckoutContactConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContactEmail",
                table: "CheckoutConfigs",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ContactEmailEnabled",
                table: "CheckoutConfigs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ContactTelegramEnabled",
                table: "CheckoutConfigs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ContactTelegramUsername",
                table: "CheckoutConfigs",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ContactWhatsAppEnabled",
                table: "CheckoutConfigs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ContactWhatsAppNumber",
                table: "CheckoutConfigs",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContactEmail",
                table: "CheckoutConfigs");

            migrationBuilder.DropColumn(
                name: "ContactEmailEnabled",
                table: "CheckoutConfigs");

            migrationBuilder.DropColumn(
                name: "ContactTelegramEnabled",
                table: "CheckoutConfigs");

            migrationBuilder.DropColumn(
                name: "ContactTelegramUsername",
                table: "CheckoutConfigs");

            migrationBuilder.DropColumn(
                name: "ContactWhatsAppEnabled",
                table: "CheckoutConfigs");

            migrationBuilder.DropColumn(
                name: "ContactWhatsAppNumber",
                table: "CheckoutConfigs");
        }
    }
}
