using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class RemoveBorderEmblemFromUserRankingCache : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SelectedBorderUrl",
                table: "UserRankingCaches");

            migrationBuilder.DropColumn(
                name: "SelectedEmblemUrl",
                table: "UserRankingCaches");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SelectedBorderUrl",
                table: "UserRankingCaches",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SelectedEmblemUrl",
                table: "UserRankingCaches",
                type: "text",
                nullable: true);
        }
    }
}
