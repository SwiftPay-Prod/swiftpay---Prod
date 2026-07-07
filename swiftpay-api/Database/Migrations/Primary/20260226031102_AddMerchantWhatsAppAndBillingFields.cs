using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddMerchantWhatsAppAndBillingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "WhatsApp",
                table: "Merchants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "AverageTicket",
                table: "MerchantKycs",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MonthlyRevenue",
                table: "MerchantKycs",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WhatsApp",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "AverageTicket",
                table: "MerchantKycs");

            migrationBuilder.DropColumn(
                name: "MonthlyRevenue",
                table: "MerchantKycs");
        }
    }
}
