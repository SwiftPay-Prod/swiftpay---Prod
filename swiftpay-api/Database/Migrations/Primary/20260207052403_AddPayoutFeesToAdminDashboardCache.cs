using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddPayoutFeesToAdminDashboardCache : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "PayoutAcquirerFeesThisMonth",
                table: "AdminDashboardCaches",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "PayoutAcquirerFeesThisWeek",
                table: "AdminDashboardCaches",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "PayoutAcquirerFeesToday",
                table: "AdminDashboardCaches",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "PayoutAcquirerFeesTotal",
                table: "AdminDashboardCaches",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "PayoutFeesThisMonth",
                table: "AdminDashboardCaches",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "PayoutFeesThisWeek",
                table: "AdminDashboardCaches",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "PayoutFeesToday",
                table: "AdminDashboardCaches",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "PayoutFeesTotal",
                table: "AdminDashboardCaches",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PayoutAcquirerFeesThisMonth",
                table: "AdminDashboardCaches");

            migrationBuilder.DropColumn(
                name: "PayoutAcquirerFeesThisWeek",
                table: "AdminDashboardCaches");

            migrationBuilder.DropColumn(
                name: "PayoutAcquirerFeesToday",
                table: "AdminDashboardCaches");

            migrationBuilder.DropColumn(
                name: "PayoutAcquirerFeesTotal",
                table: "AdminDashboardCaches");

            migrationBuilder.DropColumn(
                name: "PayoutFeesThisMonth",
                table: "AdminDashboardCaches");

            migrationBuilder.DropColumn(
                name: "PayoutFeesThisWeek",
                table: "AdminDashboardCaches");

            migrationBuilder.DropColumn(
                name: "PayoutFeesToday",
                table: "AdminDashboardCaches");

            migrationBuilder.DropColumn(
                name: "PayoutFeesTotal",
                table: "AdminDashboardCaches");
        }
    }
}
