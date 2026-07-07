using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class UpdateReferralWithdrawalSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ReferralCommissionWithdrawalCooldownHours",
                table: "Users",
                newName: "ReferralCommissionWithdrawalIntervalValue");

            migrationBuilder.RenameColumn(
                name: "ReferralCommissionWithdrawalCooldownHours",
                table: "PlatformSettings",
                newName: "ReferralCommissionWithdrawalIntervalValue");

            migrationBuilder.AddColumn<long>(
                name: "ReferralCommissionMinWithdrawalAmount",
                table: "Users",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "ReferralCommissionWithdrawalFeeFixed",
                table: "Users",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferralCommissionWithdrawalIntervalUnit",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "ReferralCommissionMinWithdrawalAmount",
                table: "PlatformSettings",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "ReferralCommissionWithdrawalFeeFixed",
                table: "PlatformSettings",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<string>(
                name: "ReferralCommissionWithdrawalIntervalUnit",
                table: "PlatformSettings",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReferralCommissionMinWithdrawalAmount",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ReferralCommissionWithdrawalFeeFixed",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ReferralCommissionWithdrawalIntervalUnit",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ReferralCommissionMinWithdrawalAmount",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "ReferralCommissionWithdrawalFeeFixed",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "ReferralCommissionWithdrawalIntervalUnit",
                table: "PlatformSettings");

            migrationBuilder.RenameColumn(
                name: "ReferralCommissionWithdrawalIntervalValue",
                table: "Users",
                newName: "ReferralCommissionWithdrawalCooldownHours");

            migrationBuilder.RenameColumn(
                name: "ReferralCommissionWithdrawalIntervalValue",
                table: "PlatformSettings",
                newName: "ReferralCommissionWithdrawalCooldownHours");
        }
    }
}
