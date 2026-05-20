using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddInlinePixKeyToPayout : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payouts_MerchantPayoutAccounts_MerchantPayoutAccountId",
                table: "Payouts");

            migrationBuilder.AlterColumn<Guid>(
                name: "MerchantPayoutAccountId",
                table: "Payouts",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "InlinePixKey",
                table: "Payouts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InlinePixKeyType",
                table: "Payouts",
                type: "text",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Payouts_MerchantPayoutAccounts_MerchantPayoutAccountId",
                table: "Payouts",
                column: "MerchantPayoutAccountId",
                principalTable: "MerchantPayoutAccounts",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payouts_MerchantPayoutAccounts_MerchantPayoutAccountId",
                table: "Payouts");

            migrationBuilder.DropColumn(
                name: "InlinePixKey",
                table: "Payouts");

            migrationBuilder.DropColumn(
                name: "InlinePixKeyType",
                table: "Payouts");

            migrationBuilder.AlterColumn<Guid>(
                name: "MerchantPayoutAccountId",
                table: "Payouts",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Payouts_MerchantPayoutAccounts_MerchantPayoutAccountId",
                table: "Payouts",
                column: "MerchantPayoutAccountId",
                principalTable: "MerchantPayoutAccounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
