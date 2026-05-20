using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddAcquirerDashboardCacheProcessingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsProcessing",
                table: "AcquirerDashboardCaches",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "NextProcessAt",
                table: "AcquirerDashboardCaches",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsProcessing",
                table: "AcquirerDashboardCaches");

            migrationBuilder.DropColumn(
                name: "NextProcessAt",
                table: "AcquirerDashboardCaches");
        }
    }
}
