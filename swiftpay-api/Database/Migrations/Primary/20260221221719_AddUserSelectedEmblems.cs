using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddUserSelectedEmblems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Achievements_SelectedEmblemAchievementId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_SelectedEmblemAchievementId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SelectedEmblemAchievementId",
                table: "Users");

            migrationBuilder.CreateTable(
                name: "UserSelectedEmblems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    AchievementId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSelectedEmblems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserSelectedEmblems_Achievements_AchievementId",
                        column: x => x.AchievementId,
                        principalTable: "Achievements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserSelectedEmblems_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserSelectedEmblems_AchievementId",
                table: "UserSelectedEmblems",
                column: "AchievementId");

            migrationBuilder.CreateIndex(
                name: "IX_UserSelectedEmblems_UserId_AchievementId",
                table: "UserSelectedEmblems",
                columns: new[] { "UserId", "AchievementId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserSelectedEmblems");

            migrationBuilder.AddColumn<Guid>(
                name: "SelectedEmblemAchievementId",
                table: "Users",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_SelectedEmblemAchievementId",
                table: "Users",
                column: "SelectedEmblemAchievementId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Achievements_SelectedEmblemAchievementId",
                table: "Users",
                column: "SelectedEmblemAchievementId",
                principalTable: "Achievements",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
