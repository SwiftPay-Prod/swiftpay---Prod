using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddGrowthRatesToMerchantDashboardCache : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ApprovalRateGrowth",
                table: "MerchantDashboardCaches",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FailedRateGrowth",
                table: "MerchantDashboardCaches",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TransactionsGrowth",
                table: "MerchantDashboardCaches",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "VolumeGrowth",
                table: "MerchantDashboardCaches",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApprovalRateGrowth",
                table: "MerchantDashboardCaches");

            migrationBuilder.DropColumn(
                name: "FailedRateGrowth",
                table: "MerchantDashboardCaches");

            migrationBuilder.DropColumn(
                name: "TransactionsGrowth",
                table: "MerchantDashboardCaches");

            migrationBuilder.DropColumn(
                name: "VolumeGrowth",
                table: "MerchantDashboardCaches");
        }
    }
}
