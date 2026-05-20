using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddMerchantHistoryTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MerchantAcquirerChangeHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Action = table.Column<string>(type: "text", nullable: false),
                    PreviousAcquirerId = table.Column<Guid>(type: "uuid", nullable: true),
                    PreviousAcquirerName = table.Column<string>(type: "text", nullable: true),
                    NewAcquirerId = table.Column<Guid>(type: "uuid", nullable: true),
                    NewAcquirerName = table.Column<string>(type: "text", nullable: true),
                    MerchantAcquirerId = table.Column<Guid>(type: "uuid", nullable: true),
                    ChangedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Reason = table.Column<string>(type: "text", nullable: true),
                    IsLegacyRecord = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchantAcquirerChangeHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchantAcquirerChangeHistories_Acquirers_NewAcquirerId",
                        column: x => x.NewAcquirerId,
                        principalTable: "Acquirers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MerchantAcquirerChangeHistories_Acquirers_PreviousAcquirerId",
                        column: x => x.PreviousAcquirerId,
                        principalTable: "Acquirers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MerchantAcquirerChangeHistories_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MerchantAcquirerChangeHistories_Users_ChangedByUserId",
                        column: x => x.ChangedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "MerchantSettingsChangeHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    PreviousValuesJson = table.Column<string>(type: "jsonb", nullable: true),
                    NewValuesJson = table.Column<string>(type: "jsonb", nullable: true),
                    ChangedFields = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    ChangedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Reason = table.Column<string>(type: "text", nullable: true),
                    IsLegacyRecord = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchantSettingsChangeHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchantSettingsChangeHistories_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MerchantSettingsChangeHistories_Users_ChangedByUserId",
                        column: x => x.ChangedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MerchantAcquirerChangeHistories_ChangedByUserId",
                table: "MerchantAcquirerChangeHistories",
                column: "ChangedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantAcquirerChangeHistories_MerchantId",
                table: "MerchantAcquirerChangeHistories",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantAcquirerChangeHistories_NewAcquirerId",
                table: "MerchantAcquirerChangeHistories",
                column: "NewAcquirerId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantAcquirerChangeHistories_PreviousAcquirerId",
                table: "MerchantAcquirerChangeHistories",
                column: "PreviousAcquirerId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantSettingsChangeHistories_ChangedByUserId",
                table: "MerchantSettingsChangeHistories",
                column: "ChangedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantSettingsChangeHistories_MerchantId",
                table: "MerchantSettingsChangeHistories",
                column: "MerchantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MerchantAcquirerChangeHistories");

            migrationBuilder.DropTable(
                name: "MerchantSettingsChangeHistories");
        }
    }
}
