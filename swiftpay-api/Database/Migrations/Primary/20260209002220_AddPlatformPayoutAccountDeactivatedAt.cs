using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddPlatformPayoutAccountDeactivatedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PlatformPayoutAccounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PixKeyType = table.Column<string>(type: "text", nullable: false),
                    PixKey = table.Column<string>(type: "text", nullable: false),
                    HolderName = table.Column<string>(type: "text", nullable: true),
                    HolderDocument = table.Column<string>(type: "text", nullable: true),
                    BankName = table.Column<string>(type: "text", nullable: true),
                    BankIspb = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    DeactivatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformPayoutAccounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlatformPayoutAccounts_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlatformPayouts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlatformPayoutAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    TotalAmount = table.Column<long>(type: "bigint", nullable: false),
                    TotalFee = table.Column<long>(type: "bigint", nullable: false),
                    TotalNetAmount = table.Column<long>(type: "bigint", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    RequestedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformPayouts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlatformPayouts_PlatformPayoutAccounts_PlatformPayoutAccoun~",
                        column: x => x.PlatformPayoutAccountId,
                        principalTable: "PlatformPayoutAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlatformPayouts_Users_RequestedByUserId",
                        column: x => x.RequestedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlatformPayoutItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlatformPayoutId = table.Column<Guid>(type: "uuid", nullable: false),
                    AcquirerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Amount = table.Column<long>(type: "bigint", nullable: false),
                    AcquirerFee = table.Column<long>(type: "bigint", nullable: false),
                    NetAmount = table.Column<long>(type: "bigint", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    AcquirerTransactionId = table.Column<string>(type: "text", nullable: true),
                    AcquirerPayoutId = table.Column<string>(type: "text", nullable: true),
                    PixEndToEndId = table.Column<string>(type: "text", nullable: true),
                    FailureReason = table.Column<string>(type: "text", nullable: true),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformPayoutItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlatformPayoutItems_Acquirers_AcquirerId",
                        column: x => x.AcquirerId,
                        principalTable: "Acquirers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlatformPayoutItems_PlatformPayouts_PlatformPayoutId",
                        column: x => x.PlatformPayoutId,
                        principalTable: "PlatformPayouts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PlatformPayoutAccounts_CreatedByUserId",
                table: "PlatformPayoutAccounts",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformPayoutAccounts_IsActive",
                table: "PlatformPayoutAccounts",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformPayoutItems_AcquirerId",
                table: "PlatformPayoutItems",
                column: "AcquirerId");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformPayoutItems_PlatformPayoutId",
                table: "PlatformPayoutItems",
                column: "PlatformPayoutId");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformPayoutItems_Status",
                table: "PlatformPayoutItems",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformPayouts_Environment",
                table: "PlatformPayouts",
                column: "Environment");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformPayouts_PlatformPayoutAccountId",
                table: "PlatformPayouts",
                column: "PlatformPayoutAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformPayouts_RequestedByUserId",
                table: "PlatformPayouts",
                column: "RequestedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PlatformPayouts_Status",
                table: "PlatformPayouts",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlatformPayoutItems");

            migrationBuilder.DropTable(
                name: "PlatformPayouts");

            migrationBuilder.DropTable(
                name: "PlatformPayoutAccounts");
        }
    }
}
