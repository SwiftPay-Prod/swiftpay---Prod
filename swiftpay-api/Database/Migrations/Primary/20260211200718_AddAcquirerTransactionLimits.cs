using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddAcquirerTransactionLimits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "MaxBoletoAmount",
                table: "Acquirers",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "MaxCreditCardAmount",
                table: "Acquirers",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "MaxPayoutAmount",
                table: "Acquirers",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "MaxPixAmount",
                table: "Acquirers",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "MinBoletoAmount",
                table: "Acquirers",
                type: "bigint",
                nullable: false,
                defaultValue: 500L);

            migrationBuilder.AddColumn<long>(
                name: "MinCreditCardAmount",
                table: "Acquirers",
                type: "bigint",
                nullable: false,
                defaultValue: 100L);

            migrationBuilder.AddColumn<long>(
                name: "MinPixAmount",
                table: "Acquirers",
                type: "bigint",
                nullable: false,
                defaultValue: 100L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxBoletoAmount",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "MaxCreditCardAmount",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "MaxPayoutAmount",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "MaxPixAmount",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "MinBoletoAmount",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "MinCreditCardAmount",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "MinPixAmount",
                table: "Acquirers");
        }
    }
}
