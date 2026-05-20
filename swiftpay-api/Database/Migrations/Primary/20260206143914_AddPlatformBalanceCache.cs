using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddPlatformBalanceCache : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PlatformBalanceCaches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    AcquirerId = table.Column<Guid>(type: "uuid", nullable: false),
                    AcquirerSettlement = table.Column<long>(type: "bigint", nullable: false),
                    AcquirerPayoutsOut = table.Column<long>(type: "bigint", nullable: false),
                    MerchantTotalAvailable = table.Column<long>(type: "bigint", nullable: false),
                    MerchantTotalBlocked = table.Column<long>(type: "bigint", nullable: false),
                    PlatformProfit = table.Column<long>(type: "bigint", nullable: false),
                    IsProcessing = table.Column<bool>(type: "boolean", nullable: false),
                    NextProcessAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CalculatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformBalanceCaches", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlatformBalanceCaches");
        }
    }
}
