using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddMissingIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Variants_ProductId",
                table: "Variants",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_MerchantId",
                table: "Products",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_DigitalItems_ProductId_VariantId_Status",
                table: "DigitalItems",
                columns: new[] { "ProductId", "VariantId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Checkouts_ShortId",
                table: "Checkouts",
                column: "ShortId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Variants_ProductId",
                table: "Variants");

            migrationBuilder.DropIndex(
                name: "IX_Products_MerchantId",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_DigitalItems_ProductId_VariantId_Status",
                table: "DigitalItems");

            migrationBuilder.DropIndex(
                name: "IX_Checkouts_ShortId",
                table: "Checkouts");
        }
    }
}
