using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddAcquirerDashboardCachePeriodAndIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AcquirerDashboardCaches_AcquirerId",
                table: "AcquirerDashboardCaches");

            migrationBuilder.AddColumn<string>(
                name: "Period",
                table: "AcquirerDashboardCaches",
                type: "text",
                nullable: false,
                defaultValue: "7d");

            migrationBuilder.CreateIndex(
                name: "IX_AcquirerDashboardCaches_AcquirerId_Period",
                table: "AcquirerDashboardCaches",
                columns: new[] { "AcquirerId", "Period" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AcquirerDashboardCaches_AcquirerId_Period",
                table: "AcquirerDashboardCaches");

            migrationBuilder.DropColumn(
                name: "Period",
                table: "AcquirerDashboardCaches");

            migrationBuilder.CreateIndex(
                name: "IX_AcquirerDashboardCaches_AcquirerId",
                table: "AcquirerDashboardCaches",
                column: "AcquirerId",
                unique: true);
        }
    }
}
