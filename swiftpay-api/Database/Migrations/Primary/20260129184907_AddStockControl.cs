using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddStockControl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LowStockThreshold",
                table: "Products",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "NotifyOnLowStock",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "StockQuantity",
                table: "Products",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TrackStock",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "DeliveryCount",
                table: "DigitalItems",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsUnlimited",
                table: "DigitalItems",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "MaxDeliveries",
                table: "DigitalItems",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReservedAt",
                table: "DigitalItems",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReservedForOrderId",
                table: "DigitalItems",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReservedForOrderItemId",
                table: "DigitalItems",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "StockNotificationSubscriptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    VariantId = table.Column<Guid>(type: "uuid", nullable: true),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    NotifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StockNotificationSubscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StockNotificationSubscriptions_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StockNotificationSubscriptions_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StockNotificationSubscriptions_Variants_VariantId",
                        column: x => x.VariantId,
                        principalTable: "Variants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DigitalItems_ReservedForOrderId",
                table: "DigitalItems",
                column: "ReservedForOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_DigitalItems_ReservedForOrderItemId",
                table: "DigitalItems",
                column: "ReservedForOrderItemId");

            migrationBuilder.CreateIndex(
                name: "IX_StockNotificationSubscriptions_MerchantId_Environment_IsAct~",
                table: "StockNotificationSubscriptions",
                columns: new[] { "MerchantId", "Environment", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_StockNotificationSubscriptions_ProductId_VariantId_IsActive",
                table: "StockNotificationSubscriptions",
                columns: new[] { "ProductId", "VariantId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_StockNotificationSubscriptions_VariantId",
                table: "StockNotificationSubscriptions",
                column: "VariantId");

            migrationBuilder.AddForeignKey(
                name: "FK_DigitalItems_OrderItems_ReservedForOrderItemId",
                table: "DigitalItems",
                column: "ReservedForOrderItemId",
                principalTable: "OrderItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_DigitalItems_Orders_ReservedForOrderId",
                table: "DigitalItems",
                column: "ReservedForOrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DigitalItems_OrderItems_ReservedForOrderItemId",
                table: "DigitalItems");

            migrationBuilder.DropForeignKey(
                name: "FK_DigitalItems_Orders_ReservedForOrderId",
                table: "DigitalItems");

            migrationBuilder.DropTable(
                name: "StockNotificationSubscriptions");

            migrationBuilder.DropIndex(
                name: "IX_DigitalItems_ReservedForOrderId",
                table: "DigitalItems");

            migrationBuilder.DropIndex(
                name: "IX_DigitalItems_ReservedForOrderItemId",
                table: "DigitalItems");

            migrationBuilder.DropColumn(
                name: "LowStockThreshold",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "NotifyOnLowStock",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "StockQuantity",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "TrackStock",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "DeliveryCount",
                table: "DigitalItems");

            migrationBuilder.DropColumn(
                name: "IsUnlimited",
                table: "DigitalItems");

            migrationBuilder.DropColumn(
                name: "MaxDeliveries",
                table: "DigitalItems");

            migrationBuilder.DropColumn(
                name: "ReservedAt",
                table: "DigitalItems");

            migrationBuilder.DropColumn(
                name: "ReservedForOrderId",
                table: "DigitalItems");

            migrationBuilder.DropColumn(
                name: "ReservedForOrderItemId",
                table: "DigitalItems");
        }
    }
}
