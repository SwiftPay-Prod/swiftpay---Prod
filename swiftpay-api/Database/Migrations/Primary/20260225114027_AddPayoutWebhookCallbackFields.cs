using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddPayoutWebhookCallbackFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CallbackAttempts",
                table: "Payouts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CallbackError",
                table: "Payouts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CallbackLastAttemptAt",
                table: "Payouts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CallbackStatus",
                table: "Payouts",
                type: "text",
                nullable: false,
                defaultValue: "NotConfigured");

            migrationBuilder.AddColumn<string>(
                name: "CallbackUrl",
                table: "Payouts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalId",
                table: "Payouts",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CallbackAttempts",
                table: "Payouts");

            migrationBuilder.DropColumn(
                name: "CallbackError",
                table: "Payouts");

            migrationBuilder.DropColumn(
                name: "CallbackLastAttemptAt",
                table: "Payouts");

            migrationBuilder.DropColumn(
                name: "CallbackStatus",
                table: "Payouts");

            migrationBuilder.DropColumn(
                name: "CallbackUrl",
                table: "Payouts");

            migrationBuilder.DropColumn(
                name: "ExternalId",
                table: "Payouts");
        }
    }
}
