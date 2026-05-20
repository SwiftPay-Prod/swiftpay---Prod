using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddBoletoTransactionLimits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "BoletoMaxTransactionAmount",
                table: "PlatformSettings",
                type: "bigint",
                nullable: false,
                defaultValue: 100000000L);

            migrationBuilder.AddColumn<long>(
                name: "BoletoMinTransactionAmount",
                table: "PlatformSettings",
                type: "bigint",
                nullable: false,
                defaultValue: 500L);

            migrationBuilder.AddColumn<long>(
                name: "BoletoMaxTransactionAmount",
                table: "MerchantSettings",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "BoletoMinTransactionAmount",
                table: "MerchantSettings",
                type: "bigint",
                nullable: true);

            // Atualiza registros existentes com valores default corretos
            migrationBuilder.Sql(
                "UPDATE \"PlatformSettings\" SET \"BoletoMinTransactionAmount\" = 500, \"BoletoMaxTransactionAmount\" = 100000000 WHERE \"BoletoMinTransactionAmount\" = 0 OR \"BoletoMaxTransactionAmount\" = 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BoletoMaxTransactionAmount",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "BoletoMinTransactionAmount",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "BoletoMaxTransactionAmount",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "BoletoMinTransactionAmount",
                table: "MerchantSettings");
        }
    }
}
