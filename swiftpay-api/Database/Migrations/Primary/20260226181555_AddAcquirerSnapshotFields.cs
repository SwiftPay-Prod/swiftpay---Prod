using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddAcquirerSnapshotFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AcquirerDisplayName",
                table: "Payouts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AcquirerNominal",
                table: "Payouts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AcquirerDisplayName",
                table: "Payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AcquirerNominal",
                table: "Payments",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AcquirerDisplayName",
                table: "Payouts");

            migrationBuilder.DropColumn(
                name: "AcquirerNominal",
                table: "Payouts");

            migrationBuilder.DropColumn(
                name: "AcquirerDisplayName",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "AcquirerNominal",
                table: "Payments");
        }
    }
}
