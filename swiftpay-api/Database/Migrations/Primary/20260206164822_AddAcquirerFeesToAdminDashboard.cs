using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddAcquirerFeesToAdminDashboard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "AcquirerFeesThisMonth",
                table: "AdminDashboardCaches",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "AcquirerFeesThisWeek",
                table: "AdminDashboardCaches",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "AcquirerFeesToday",
                table: "AdminDashboardCaches",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "TotalAcquirerFees",
                table: "AdminDashboardCaches",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AcquirerFeesThisMonth",
                table: "AdminDashboardCaches");

            migrationBuilder.DropColumn(
                name: "AcquirerFeesThisWeek",
                table: "AdminDashboardCaches");

            migrationBuilder.DropColumn(
                name: "AcquirerFeesToday",
                table: "AdminDashboardCaches");

            migrationBuilder.DropColumn(
                name: "TotalAcquirerFees",
                table: "AdminDashboardCaches");
        }
    }
}
