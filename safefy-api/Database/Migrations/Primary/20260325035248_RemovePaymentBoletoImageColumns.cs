using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class RemovePaymentBoletoImageColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BarcodeImageUrl",
                table: "PaymentsBoleto");

            migrationBuilder.DropColumn(
                name: "PixQrCode",
                table: "PaymentsBoleto");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BarcodeImageUrl",
                table: "PaymentsBoleto",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PixQrCode",
                table: "PaymentsBoleto",
                type: "text",
                nullable: true);
        }
    }
}
