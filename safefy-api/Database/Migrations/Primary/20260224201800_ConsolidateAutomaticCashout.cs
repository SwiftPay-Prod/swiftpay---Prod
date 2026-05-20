using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class ConsolidateAutomaticCashout : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "PlatformSettings"
                ADD COLUMN IF NOT EXISTS "AutomaticCashoutFrequency" text;

                ALTER TABLE "PlatformSettings"
                ADD COLUMN IF NOT EXISTS "AutomaticCashoutMaxAmount" bigint;

                ALTER TABLE "PlatformSettings"
                ADD COLUMN IF NOT EXISTS "AutomaticCashoutMinAmount" bigint NOT NULL DEFAULT 0;

                ALTER TABLE "PlatformSettings"
                ADD COLUMN IF NOT EXISTS "AutomaticCashoutPayoutAccountId" uuid;

                ALTER TABLE "PlatformSettings"
                ADD COLUMN IF NOT EXISTS "IsAutomaticCashoutEnabled" boolean NOT NULL DEFAULT FALSE;

                ALTER TABLE "MerchantSettings"
                ADD COLUMN IF NOT EXISTS "AutomaticCashoutFrequency" text;

                ALTER TABLE "MerchantSettings"
                ADD COLUMN IF NOT EXISTS "AutomaticCashoutMaxAmount" bigint;

                ALTER TABLE "MerchantSettings"
                ADD COLUMN IF NOT EXISTS "AutomaticCashoutMinAmount" bigint;

                ALTER TABLE "MerchantSettings"
                ADD COLUMN IF NOT EXISTS "AutomaticCashoutPayoutAccountId" uuid;

                ALTER TABLE "MerchantSettings"
                ADD COLUMN IF NOT EXISTS "IsAutomaticCashoutEnabled" boolean NOT NULL DEFAULT FALSE;
            """);

            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'PlatformSettings'
                          AND column_name = 'AutomaticPlatformCashoutFrequency'
                    ) THEN
                        UPDATE "PlatformSettings"
                        SET "AutomaticCashoutFrequency" = COALESCE("AutomaticCashoutFrequency", "AutomaticPlatformCashoutFrequency");
                    END IF;

                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'PlatformSettings'
                          AND column_name = 'IsAutomaticPlatformCashoutEnabled'
                    ) THEN
                        UPDATE "PlatformSettings"
                        SET "IsAutomaticCashoutEnabled" = "IsAutomaticPlatformCashoutEnabled";
                    END IF;

                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'PlatformSettings'
                          AND column_name = 'AutomaticPlatformCashoutMinAmount'
                    ) THEN
                        UPDATE "PlatformSettings"
                        SET "AutomaticCashoutMinAmount" = GREATEST("AutomaticCashoutMinAmount", "AutomaticPlatformCashoutMinAmount");
                    END IF;

                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'PlatformSettings'
                          AND column_name = 'AutomaticPlatformCashoutFrequency'
                    ) THEN
                        ALTER TABLE "PlatformSettings" DROP COLUMN "AutomaticPlatformCashoutFrequency";
                    END IF;

                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'PlatformSettings'
                          AND column_name = 'IsAutomaticPlatformCashoutEnabled'
                    ) THEN
                        ALTER TABLE "PlatformSettings" DROP COLUMN "IsAutomaticPlatformCashoutEnabled";
                    END IF;

                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'PlatformSettings'
                          AND column_name = 'AutomaticPlatformCashoutMinAmount'
                    ) THEN
                        ALTER TABLE "PlatformSettings" DROP COLUMN "AutomaticPlatformCashoutMinAmount";
                    END IF;
                END $$;
            """);

            migrationBuilder.Sql("""
                UPDATE "PlatformSettings"
                SET "AutomaticCashoutFrequency" = COALESCE(NULLIF("AutomaticCashoutFrequency", ''), 'Daily');

                UPDATE "MerchantSettings"
                SET "AutomaticCashoutFrequency" = COALESCE(NULLIF("AutomaticCashoutFrequency", ''), 'Daily');

                ALTER TABLE "PlatformSettings"
                ALTER COLUMN "AutomaticCashoutFrequency" SET DEFAULT 'Daily';

                ALTER TABLE "PlatformSettings"
                ALTER COLUMN "AutomaticCashoutFrequency" SET NOT NULL;

                ALTER TABLE "MerchantSettings"
                ALTER COLUMN "AutomaticCashoutFrequency" SET DEFAULT 'Daily';

                ALTER TABLE "MerchantSettings"
                ALTER COLUMN "AutomaticCashoutFrequency" SET NOT NULL;
            """);

            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS "AutomaticCashoutLogs" (
                    "Id" uuid NOT NULL,
                    "MerchantId" uuid NULL,
                    "Environment" text NOT NULL,
                    "AmountAttempted" bigint NOT NULL,
                    "NetAmount" bigint NOT NULL,
                    "Status" text NOT NULL,
                    "Message" text NOT NULL,
                    "TechnicalDetails" text NULL,
                    "PayoutId" uuid NULL,
                    "CreatedAt" timestamp with time zone NOT NULL,
                    "UpdatedAt" timestamp with time zone NOT NULL,
                    CONSTRAINT "PK_AutomaticCashoutLogs" PRIMARY KEY ("Id"),
                    CONSTRAINT "FK_AutomaticCashoutLogs_Merchants_MerchantId"
                        FOREIGN KEY ("MerchantId") REFERENCES "Merchants" ("Id") ON DELETE SET NULL,
                    CONSTRAINT "FK_AutomaticCashoutLogs_Payouts_PayoutId"
                        FOREIGN KEY ("PayoutId") REFERENCES "Payouts" ("Id") ON DELETE SET NULL
                );

                CREATE INDEX IF NOT EXISTS "IX_AutomaticCashoutLogs_MerchantId"
                ON "AutomaticCashoutLogs" ("MerchantId");

                CREATE INDEX IF NOT EXISTS "IX_AutomaticCashoutLogs_PayoutId"
                ON "AutomaticCashoutLogs" ("PayoutId");
            """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AutomaticCashoutLogs");

            migrationBuilder.DropColumn(
                name: "AutomaticCashoutFrequency",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "AutomaticCashoutMaxAmount",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "AutomaticCashoutMinAmount",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "AutomaticCashoutPayoutAccountId",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "IsAutomaticCashoutEnabled",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "AutomaticCashoutFrequency",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "AutomaticCashoutMaxAmount",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "AutomaticCashoutMinAmount",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "AutomaticCashoutPayoutAccountId",
                table: "MerchantSettings");

            migrationBuilder.DropColumn(
                name: "IsAutomaticCashoutEnabled",
                table: "MerchantSettings");
        }
    }
}
