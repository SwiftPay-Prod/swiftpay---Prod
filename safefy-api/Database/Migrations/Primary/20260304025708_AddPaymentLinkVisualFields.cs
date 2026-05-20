using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddPaymentLinkVisualFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ColorMode",
                table: "PaymentLinks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "PaymentLinks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PrimaryColor",
                table: "PaymentLinks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SecondaryColor",
                table: "PaymentLinks",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ColorMode",
                table: "PaymentLinks");

            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "PaymentLinks");

            migrationBuilder.DropColumn(
                name: "PrimaryColor",
                table: "PaymentLinks");

            migrationBuilder.DropColumn(
                name: "SecondaryColor",
                table: "PaymentLinks");
        }
    }
}
