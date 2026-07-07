using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddMerchantNominalAbTestLimitsAndWinner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsAutoFinished",
                table: "MerchantNominalAbTests",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "LimitType",
                table: "MerchantNominalAbTests",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "MaxDurationDays",
                table: "MerchantNominalAbTests",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "MaxTransactions",
                table: "MerchantNominalAbTests",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "WinnerMerchantAcquirerId",
                table: "MerchantNominalAbTests",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsAutoFinished",
                table: "MerchantNominalAbTests");

            migrationBuilder.DropColumn(
                name: "LimitType",
                table: "MerchantNominalAbTests");

            migrationBuilder.DropColumn(
                name: "MaxDurationDays",
                table: "MerchantNominalAbTests");

            migrationBuilder.DropColumn(
                name: "MaxTransactions",
                table: "MerchantNominalAbTests");

            migrationBuilder.DropColumn(
                name: "WinnerMerchantAcquirerId",
                table: "MerchantNominalAbTests");
        }
    }
}
