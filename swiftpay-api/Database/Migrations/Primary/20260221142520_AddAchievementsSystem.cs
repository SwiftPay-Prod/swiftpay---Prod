using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddAchievementsSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RankingSuspendedUntil",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RankingSuspensionReason",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SelectedBorderLevel",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SelectedEmblemAchievementId",
                table: "Users",
                type: "uuid",
                nullable: true);

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

            migrationBuilder.CreateTable(
                name: "Achievements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Subtitle = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    ImageUrl = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    ThresholdAmount = table.Column<long>(type: "bigint", nullable: true),
                    Tags = table.Column<string>(type: "text", nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Achievements", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LevelConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Level = table.Column<string>(type: "text", nullable: false),
                    DisplayName = table.Column<string>(type: "text", nullable: false),
                    MinVolume = table.Column<long>(type: "bigint", nullable: false),
                    MaxVolume = table.Column<long>(type: "bigint", nullable: true),
                    BorderImageUrl = table.Column<string>(type: "text", nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LevelConfigs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MerchantAchievements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    AchievementId = table.Column<Guid>(type: "uuid", nullable: false),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    EarnedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchantAchievements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchantAchievements_Achievements_AchievementId",
                        column: x => x.AchievementId,
                        principalTable: "Achievements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MerchantAchievements_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_SelectedEmblemAchievementId",
                table: "Users",
                column: "SelectedEmblemAchievementId");

            migrationBuilder.CreateIndex(
                name: "IX_Achievements_Key",
                table: "Achievements",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LevelConfigs_Level",
                table: "LevelConfigs",
                column: "Level",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MerchantAchievements_AchievementId",
                table: "MerchantAchievements",
                column: "AchievementId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantAchievements_MerchantId_AchievementId_Environment",
                table: "MerchantAchievements",
                columns: new[] { "MerchantId", "AchievementId", "Environment" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Achievements_SelectedEmblemAchievementId",
                table: "Users",
                column: "SelectedEmblemAchievementId",
                principalTable: "Achievements",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Achievements_SelectedEmblemAchievementId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "LevelConfigs");

            migrationBuilder.DropTable(
                name: "MerchantAchievements");

            migrationBuilder.DropTable(
                name: "Achievements");

            migrationBuilder.DropIndex(
                name: "IX_Users_SelectedEmblemAchievementId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "RankingSuspendedUntil",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "RankingSuspensionReason",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SelectedBorderLevel",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SelectedEmblemAchievementId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SelectedBorderUrl",
                table: "UserRankingCaches");

            migrationBuilder.DropColumn(
                name: "SelectedEmblemUrl",
                table: "UserRankingCaches");
        }
    }
}
