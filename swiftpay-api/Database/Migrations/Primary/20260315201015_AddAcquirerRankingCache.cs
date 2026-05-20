using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddAcquirerRankingCache : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AcquirerRankingCaches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AcquirerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    SampleSize = table.Column<int>(type: "integer", nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: false),
                    ApprovalRate = table.Column<decimal>(type: "numeric", nullable: false),
                    ApprovedTransactions = table.Column<int>(type: "integer", nullable: false),
                    RejectedTransactions = table.Column<int>(type: "integer", nullable: false),
                    AnalyzedTransactions = table.Column<int>(type: "integer", nullable: false),
                    CalculatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AcquirerRankingCaches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AcquirerRankingCaches_Acquirers_AcquirerId",
                        column: x => x.AcquirerId,
                        principalTable: "Acquirers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AcquirerRankingCaches_AcquirerId_Environment",
                table: "AcquirerRankingCaches",
                columns: new[] { "AcquirerId", "Environment" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AcquirerRankingCaches_Environment_Position",
                table: "AcquirerRankingCaches",
                columns: new[] { "Environment", "Position" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AcquirerRankingCaches");
        }
    }
}
