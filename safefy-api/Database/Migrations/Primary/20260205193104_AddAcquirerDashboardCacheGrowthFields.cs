using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddAcquirerDashboardCacheGrowthFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ApprovalRateGrowth",
                table: "AcquirerDashboardCaches",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FailedRateGrowth",
                table: "AcquirerDashboardCaches",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GrowthComparisonLabel",
                table: "AcquirerDashboardCaches",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ProfitGrowth",
                table: "AcquirerDashboardCaches",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TransactionsGrowth",
                table: "AcquirerDashboardCaches",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "VolumeGrowth",
                table: "AcquirerDashboardCaches",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApprovalRateGrowth",
                table: "AcquirerDashboardCaches");

            migrationBuilder.DropColumn(
                name: "FailedRateGrowth",
                table: "AcquirerDashboardCaches");

            migrationBuilder.DropColumn(
                name: "GrowthComparisonLabel",
                table: "AcquirerDashboardCaches");

            migrationBuilder.DropColumn(
                name: "ProfitGrowth",
                table: "AcquirerDashboardCaches");

            migrationBuilder.DropColumn(
                name: "TransactionsGrowth",
                table: "AcquirerDashboardCaches");

            migrationBuilder.DropColumn(
                name: "VolumeGrowth",
                table: "AcquirerDashboardCaches");
        }
    }
}
