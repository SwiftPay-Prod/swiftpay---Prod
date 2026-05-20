using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddQueryFiltersToAdminAndPlatformCaches : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_PlatformBalanceCaches_AcquirerId_Environment",
                table: "PlatformBalanceCaches",
                columns: new[] { "AcquirerId", "Environment" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AdminDashboardCaches_Environment",
                table: "AdminDashboardCaches",
                column: "Environment",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PlatformBalanceCaches_AcquirerId_Environment",
                table: "PlatformBalanceCaches");

            migrationBuilder.DropIndex(
                name: "IX_AdminDashboardCaches_Environment",
                table: "AdminDashboardCaches");
        }
    }
}
