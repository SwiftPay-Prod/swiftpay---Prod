using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddReferralRankingCache : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ReferralRankingCaches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    TotalReferrals = table.Column<int>(type: "integer", nullable: false),
                    TotalCommission = table.Column<long>(type: "bigint", nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: false),
                    PreviousPosition = table.Column<int>(type: "integer", nullable: true),
                    PositionChange = table.Column<int>(type: "integer", nullable: false),
                    CalculatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReferralRankingCaches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReferralRankingCaches_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReferralRankingCaches_Environment_Position",
                table: "ReferralRankingCaches",
                columns: new[] { "Environment", "Position" });

            migrationBuilder.CreateIndex(
                name: "IX_ReferralRankingCaches_UserId_Environment",
                table: "ReferralRankingCaches",
                columns: new[] { "UserId", "Environment" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReferralRankingCaches");
        }
    }
}
