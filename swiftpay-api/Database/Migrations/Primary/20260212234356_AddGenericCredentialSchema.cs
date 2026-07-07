using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddGenericCredentialSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Credentials",
                table: "MerchantAcquirers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CredentialSchema",
                table: "Acquirers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultCredentials",
                table: "Acquirers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultCredentialsSandbox",
                table: "Acquirers",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Credentials",
                table: "MerchantAcquirers");

            migrationBuilder.DropColumn(
                name: "CredentialSchema",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "DefaultCredentials",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "DefaultCredentialsSandbox",
                table: "Acquirers");
        }
    }
}
