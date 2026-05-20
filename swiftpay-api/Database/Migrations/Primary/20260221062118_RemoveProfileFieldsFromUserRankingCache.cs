using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class RemoveProfileFieldsFromUserRankingCache : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Bio",
                table: "UserRankingCaches");

            migrationBuilder.DropColumn(
                name: "ProfileImageUrl",
                table: "UserRankingCaches");

            migrationBuilder.DropColumn(
                name: "SocialLinks",
                table: "UserRankingCaches");

            migrationBuilder.DropColumn(
                name: "UserName",
                table: "UserRankingCaches");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Bio",
                table: "UserRankingCaches",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProfileImageUrl",
                table: "UserRankingCaches",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SocialLinks",
                table: "UserRankingCaches",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserName",
                table: "UserRankingCaches",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
