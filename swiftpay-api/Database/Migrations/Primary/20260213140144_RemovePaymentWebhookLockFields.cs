using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class RemovePaymentWebhookLockFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsProcessingWebhook",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "WebhookProcessingStartedAt",
                table: "Payments");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsProcessingWebhook",
                table: "Payments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "WebhookProcessingStartedAt",
                table: "Payments",
                type: "timestamp with time zone",
                nullable: true);
        }
    }
}
