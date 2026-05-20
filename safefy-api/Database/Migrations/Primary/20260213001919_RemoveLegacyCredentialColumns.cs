using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class RemoveLegacyCredentialColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AccessToken",
                table: "MerchantAcquirers");

            migrationBuilder.DropColumn(
                name: "ApiKey",
                table: "MerchantAcquirers");

            migrationBuilder.DropColumn(
                name: "ApiSecret",
                table: "MerchantAcquirers");

            migrationBuilder.DropColumn(
                name: "ClientId",
                table: "MerchantAcquirers");

            migrationBuilder.DropColumn(
                name: "ClientSecret",
                table: "MerchantAcquirers");

            migrationBuilder.DropColumn(
                name: "RefreshToken",
                table: "MerchantAcquirers");

            migrationBuilder.DropColumn(
                name: "TokenExpiresAt",
                table: "MerchantAcquirers");

            migrationBuilder.DropColumn(
                name: "DefaultApiKey",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "DefaultApiKeySandbox",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "DefaultApiSecret",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "DefaultApiSecretSandbox",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "DefaultClientId",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "DefaultClientIdSandbox",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "DefaultClientSecret",
                table: "Acquirers");

            migrationBuilder.DropColumn(
                name: "DefaultClientSecretSandbox",
                table: "Acquirers");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AccessToken",
                table: "MerchantAcquirers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ApiKey",
                table: "MerchantAcquirers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ApiSecret",
                table: "MerchantAcquirers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ClientId",
                table: "MerchantAcquirers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ClientSecret",
                table: "MerchantAcquirers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RefreshToken",
                table: "MerchantAcquirers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TokenExpiresAt",
                table: "MerchantAcquirers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultApiKey",
                table: "Acquirers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultApiKeySandbox",
                table: "Acquirers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultApiSecret",
                table: "Acquirers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultApiSecretSandbox",
                table: "Acquirers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultClientId",
                table: "Acquirers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultClientIdSandbox",
                table: "Acquirers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultClientSecret",
                table: "Acquirers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultClientSecretSandbox",
                table: "Acquirers",
                type: "text",
                nullable: true);
        }
    }
}
