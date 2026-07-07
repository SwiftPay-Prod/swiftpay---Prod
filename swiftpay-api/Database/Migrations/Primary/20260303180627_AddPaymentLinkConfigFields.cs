using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddPaymentLinkConfigFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RedirectUrl",
                table: "PaymentLinks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequiredBuyerFields",
                table: "PaymentLinks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ShowFees",
                table: "PaymentLinks",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RedirectUrl",
                table: "PaymentLinks");

            migrationBuilder.DropColumn(
                name: "RequiredBuyerFields",
                table: "PaymentLinks");

            migrationBuilder.DropColumn(
                name: "ShowFees",
                table: "PaymentLinks");
        }
    }
}
