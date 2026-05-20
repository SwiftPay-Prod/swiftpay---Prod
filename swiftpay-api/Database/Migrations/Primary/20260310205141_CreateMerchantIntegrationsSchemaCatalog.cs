using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class CreateMerchantIntegrationsSchemaCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MerchantIntegrations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Provider = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    ConfigValues = table.Column<Dictionary<string, string>>(type: "jsonb", nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    WaitingPaymentEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    PaidEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    RefusedEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    RefundedEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    ChargedbackEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchantIntegrations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchantIntegrations_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MerchantIntegrations_MerchantId_Environment_Type",
                table: "MerchantIntegrations",
                columns: new[] { "MerchantId", "Environment", "Type" });

            migrationBuilder.CreateIndex(
                name: "IX_MerchantIntegrations_MerchantId_Provider_Environment",
                table: "MerchantIntegrations",
                columns: new[] { "MerchantId", "Provider", "Environment" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MerchantIntegrations");
        }
    }
}
