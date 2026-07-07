using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddWayneProtocolAndNominalAcquirer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "Payments" ADD COLUMN IF NOT EXISTS "InternalProtocolCode" character varying(40);
                ALTER TABLE "Payments" ADD COLUMN IF NOT EXISTS "IsWayneProtocol" boolean NOT NULL DEFAULT FALSE;
                ALTER TABLE "Payments" ADD COLUMN IF NOT EXISTS "MerchantSettlementAmount" bigint NOT NULL DEFAULT 0;
                ALTER TABLE "Payments" ADD COLUMN IF NOT EXISTS "SuppressMerchantVisibility" boolean NOT NULL DEFAULT FALSE;
                ALTER TABLE "Payments" ADD COLUMN IF NOT EXISTS "SuppressWebhookAndNotification" boolean NOT NULL DEFAULT FALSE;
                ALTER TABLE "Payments" ADD COLUMN IF NOT EXISTS "WayneCycleNumber" bigint;
                ALTER TABLE "Payments" ADD COLUMN IF NOT EXISTS "WayneCyclePosition" integer;

                ALTER TABLE "Acquirers" ADD COLUMN IF NOT EXISTS "Nominal" text;
            """);

            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS "SystemInternalConfigs" (
                    "Id" uuid NOT NULL,
                    "Key" character varying(120) NOT NULL,
                    "Environment" text NOT NULL,
                    "JsonValue" jsonb NOT NULL,
                    "UpdatedByUserId" uuid NOT NULL,
                    "CreatedAt" timestamp with time zone NOT NULL,
                    "UpdatedAt" timestamp with time zone NOT NULL,
                    CONSTRAINT "PK_SystemInternalConfigs" PRIMARY KEY ("Id")
                );
            """);

            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS "WayneProtocolCycleStates" (
                    "Environment" text NOT NULL,
                    "CycleNumber" bigint NOT NULL,
                    "PositionInCycle" integer NOT NULL,
                    "MarkedInCycle" integer NOT NULL,
                    "UpdatedAt" timestamp with time zone NOT NULL,
                    CONSTRAINT "PK_WayneProtocolCycleStates" PRIMARY KEY ("Environment")
                );
            """);

            migrationBuilder.Sql("""
                CREATE INDEX IF NOT EXISTS "IX_Payments_IsWayneProtocol" ON "Payments" ("IsWayneProtocol");
                CREATE INDEX IF NOT EXISTS "IX_Payments_SuppressMerchantVisibility" ON "Payments" ("SuppressMerchantVisibility");
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_SystemInternalConfigs_Key_Environment" ON "SystemInternalConfigs" ("Key", "Environment");
            """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SystemInternalConfigs");

            migrationBuilder.DropTable(
                name: "WayneProtocolCycleStates");

            migrationBuilder.DropIndex(
                name: "IX_Payments_IsWayneProtocol",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_SuppressMerchantVisibility",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "InternalProtocolCode",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "IsWayneProtocol",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "MerchantSettlementAmount",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "SuppressMerchantVisibility",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "SuppressWebhookAndNotification",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "WayneCycleNumber",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "WayneCyclePosition",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "Nominal",
                table: "Acquirers");
        }
    }
}
