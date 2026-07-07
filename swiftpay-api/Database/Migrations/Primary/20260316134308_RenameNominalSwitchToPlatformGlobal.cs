using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class RenameNominalSwitchToPlatformGlobal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BlockSelfNominalSwitch",
                table: "MerchantSettings");

            migrationBuilder.AddColumn<bool>(
                name: "SelfNominalSwitchEnabled",
                table: "PlatformSettings",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SelfNominalSwitchEnabled",
                table: "PlatformSettings");

            migrationBuilder.AddColumn<bool>(
                name: "BlockSelfNominalSwitch",
                table: "MerchantSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
