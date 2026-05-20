using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddDigitalItemsAndDeliverySettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DigitalItemsPerPurchase",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "DigitalItemsDeliveredAt",
                table: "OrderItems",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProductType",
                table: "OrderItems",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "DigitalDeliveryEmailSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    Enabled = table.Column<bool>(type: "boolean", nullable: false),
                    Subject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Greeting = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    IntroText = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ItemsSectionTitle = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    OutroText = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    FooterText = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    LogoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    BannerImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PrimaryColor = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    BackgroundColor = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    ShowProductImages = table.Column<bool>(type: "boolean", nullable: false),
                    ShowPrices = table.Column<bool>(type: "boolean", nullable: false),
                    Layout = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DigitalDeliveryEmailSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DigitalDeliveryEmailSettings_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DigitalItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    VariantId = table.Column<Guid>(type: "uuid", nullable: true),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    DeliveredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeliveredToOrderId = table.Column<Guid>(type: "uuid", nullable: true),
                    DeliveredToOrderItemId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DigitalItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DigitalItems_OrderItems_DeliveredToOrderItemId",
                        column: x => x.DeliveredToOrderItemId,
                        principalTable: "OrderItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_DigitalItems_Orders_DeliveredToOrderId",
                        column: x => x.DeliveredToOrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_DigitalItems_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DigitalItems_Variants_VariantId",
                        column: x => x.VariantId,
                        principalTable: "Variants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DigitalDeliveryEmailSettings_MerchantId_Environment",
                table: "DigitalDeliveryEmailSettings",
                columns: new[] { "MerchantId", "Environment" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DigitalItems_DeliveredToOrderId",
                table: "DigitalItems",
                column: "DeliveredToOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_DigitalItems_DeliveredToOrderItemId",
                table: "DigitalItems",
                column: "DeliveredToOrderItemId");

            migrationBuilder.CreateIndex(
                name: "IX_DigitalItems_ProductId",
                table: "DigitalItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_DigitalItems_ProductId_Status",
                table: "DigitalItems",
                columns: new[] { "ProductId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_DigitalItems_Status",
                table: "DigitalItems",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_DigitalItems_VariantId",
                table: "DigitalItems",
                column: "VariantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DigitalDeliveryEmailSettings");

            migrationBuilder.DropTable(
                name: "DigitalItems");

            migrationBuilder.DropColumn(
                name: "DigitalItemsPerPurchase",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "DigitalItemsDeliveredAt",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "ProductType",
                table: "OrderItems");
        }
    }
}
