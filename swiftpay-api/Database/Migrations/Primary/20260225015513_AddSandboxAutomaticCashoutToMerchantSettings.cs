using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddSandboxAutomaticCashoutToMerchantSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AutomaticCashoutFrequencySandbox",
                table: "MerchantSettings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<long>(
                name: "AutomaticCashoutMaxAmountSandbox",
                table: "MerchantSettings",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "AutomaticCashoutMinAmountSandbox",
                table: "MerchantSettings",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AutomaticCashoutPayoutAccountIdSandbox",
                table: "MerchantSettings",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsAutomaticCashoutEnabledSandbox",
                table: "MerchantSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AutomaticCashoutFrequencySandbox",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "AutomaticCashoutMaxAmountSandbox",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "AutomaticCashoutMinAmountSandbox",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "AutomaticCashoutPayoutAccountIdSandbox",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "IsAutomaticCashoutEnabledSandbox",
                table: "MerchantSettings");
        }
    }
}
