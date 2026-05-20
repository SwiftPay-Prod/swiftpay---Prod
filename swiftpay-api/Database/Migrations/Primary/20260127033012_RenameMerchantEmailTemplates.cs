using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class RenameMerchantEmailTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop old unique index
            migrationBuilder.DropIndex(
                name: "IX_DigitalDeliveryEmailSettings_MerchantId_Environment",
                table: "DigitalDeliveryEmailSettings");

            // Rename table
            migrationBuilder.RenameTable(
                name: "DigitalDeliveryEmailSettings",
                newName: "MerchantEmailTemplates");

            // Add Type column with default value for existing rows
            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "MerchantEmailTemplates",
                type: "text",
                nullable: false,
                defaultValue: "DigitalDelivery");

            // Rename PK constraint
            migrationBuilder.RenameIndex(
                name: "PK_DigitalDeliveryEmailSettings",
                table: "MerchantEmailTemplates",
                newName: "PK_MerchantEmailTemplates");

            // Rename FK constraint
            migrationBuilder.DropForeignKey(
                name: "FK_DigitalDeliveryEmailSettings_Merchants_MerchantId",
                table: "MerchantEmailTemplates");

            migrationBuilder.AddForeignKey(
                name: "FK_MerchantEmailTemplates_Merchants_MerchantId",
                table: "MerchantEmailTemplates",
                column: "MerchantId",
                principalTable: "Merchants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // Create new unique index including Type
            migrationBuilder.CreateIndex(
                name: "IX_MerchantEmailTemplates_MerchantId_Type_Environment",
                table: "MerchantEmailTemplates",
                columns: new[] { "MerchantId", "Type", "Environment" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop new unique index
            migrationBuilder.DropIndex(
                name: "IX_MerchantEmailTemplates_MerchantId_Type_Environment",
                table: "MerchantEmailTemplates");

            // Drop FK
            migrationBuilder.DropForeignKey(
                name: "FK_MerchantEmailTemplates_Merchants_MerchantId",
                table: "MerchantEmailTemplates");

            // Drop Type column
            migrationBuilder.DropColumn(
                name: "Type",
                table: "MerchantEmailTemplates");

            // Rename table back
            migrationBuilder.RenameTable(
                name: "MerchantEmailTemplates",
                newName: "DigitalDeliveryEmailSettings");

            // Rename PK back
            migrationBuilder.RenameIndex(
                name: "PK_MerchantEmailTemplates",
                table: "DigitalDeliveryEmailSettings",
                newName: "PK_DigitalDeliveryEmailSettings");

            // Add FK back
            migrationBuilder.AddForeignKey(
                name: "FK_DigitalDeliveryEmailSettings_Merchants_MerchantId",
                table: "DigitalDeliveryEmailSettings",
                column: "MerchantId",
                principalTable: "Merchants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // Create old unique index
            migrationBuilder.CreateIndex(
                name: "IX_DigitalDeliveryEmailSettings_MerchantId_Environment",
                table: "DigitalDeliveryEmailSettings",
                columns: new[] { "MerchantId", "Environment" },
                unique: true);
        }
    }
}
