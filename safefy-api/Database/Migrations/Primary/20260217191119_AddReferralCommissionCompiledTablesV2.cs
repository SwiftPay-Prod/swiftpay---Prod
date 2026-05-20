using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddReferralCommissionCompiledTablesV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ReferralCommissionBalances",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReferrerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    AvailableBalance = table.Column<long>(type: "bigint", nullable: false),
                    TotalGenerated = table.Column<long>(type: "bigint", nullable: false),
                    TotalPaid = table.Column<long>(type: "bigint", nullable: false),
                    TotalPendingWithdrawal = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReferralCommissionBalances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReferralCommissionBalances_Users_ReferrerUserId",
                        column: x => x.ReferrerUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReferralCommissionMovements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReferrerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReferredUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceType = table.Column<string>(type: "text", nullable: false),
                    SourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceAmount = table.Column<long>(type: "bigint", nullable: false),
                    ReferralCommissionPercentage = table.Column<int>(type: "integer", nullable: false),
                    CommissionAmount = table.Column<long>(type: "bigint", nullable: false),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    OccurredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Description = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReferralCommissionMovements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReferralCommissionMovements_Users_ReferredUserId",
                        column: x => x.ReferredUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ReferralCommissionMovements_Users_ReferrerUserId",
                        column: x => x.ReferrerUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReferralReferredUserSummaries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReferrerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReferredUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    TotalCommissionFromPayments = table.Column<long>(type: "bigint", nullable: false),
                    TotalCommissionFromPayouts = table.Column<long>(type: "bigint", nullable: false),
                    TotalCommissionAmount = table.Column<long>(type: "bigint", nullable: false),
                    LastMovementAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReferralReferredUserSummaries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReferralReferredUserSummaries_Users_ReferredUserId",
                        column: x => x.ReferredUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ReferralReferredUserSummaries_Users_ReferrerUserId",
                        column: x => x.ReferrerUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReferralCommissionBalances_ReferrerUserId_Environment",
                table: "ReferralCommissionBalances",
                columns: new[] { "ReferrerUserId", "Environment" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReferralCommissionMovements_ReferredUserId_Environment_Occu~",
                table: "ReferralCommissionMovements",
                columns: new[] { "ReferredUserId", "Environment", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ReferralCommissionMovements_ReferrerUserId_Environment_Occu~",
                table: "ReferralCommissionMovements",
                columns: new[] { "ReferrerUserId", "Environment", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ReferralCommissionMovements_SourceType_SourceId_ReferrerUse~",
                table: "ReferralCommissionMovements",
                columns: new[] { "SourceType", "SourceId", "ReferrerUserId", "ReferredUserId", "Environment" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReferralReferredUserSummaries_ReferredUserId",
                table: "ReferralReferredUserSummaries",
                column: "ReferredUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ReferralReferredUserSummaries_ReferrerUserId_Environment_La~",
                table: "ReferralReferredUserSummaries",
                columns: new[] { "ReferrerUserId", "Environment", "LastMovementAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ReferralReferredUserSummaries_ReferrerUserId_ReferredUserId~",
                table: "ReferralReferredUserSummaries",
                columns: new[] { "ReferrerUserId", "ReferredUserId", "Environment" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReferralCommissionBalances");

            migrationBuilder.DropTable(
                name: "ReferralCommissionMovements");

            migrationBuilder.DropTable(
                name: "ReferralReferredUserSummaries");
        }
    }
}
