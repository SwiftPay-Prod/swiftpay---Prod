using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddAcquirerOperationEnabledFlags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "BoletoEnabled",
                table: "MerchantAcquirers",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "CreditCardEnabled",
                table: "MerchantAcquirers",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PixEnabled",
                table: "MerchantAcquirers",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "BoletoEnabled",
                table: "Acquirers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "ClonedFromId",
                table: "Acquirers",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "CreditCardEnabled",
                table: "Acquirers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "DisplayName",
                table: "Acquirers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PixEnabled",
                table: "Acquirers",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BoletoEnabled",
                table: "MerchantAcquirers");

            migrationBuilder.DropColumn(
                name: "CreditCardEnabled",
                table: "MerchantAcquirers");

            migrationBuilder.DropColumn(
                name: "PixEnabled",
                table: "MerchantAcquirers");

            migrationBuilder.DropColumn(
                name: "BoletoEnabled",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "ClonedFromId",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "CreditCardEnabled",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "DisplayName",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "PixEnabled",
                table: "Acquirers");
        }
    }
}
