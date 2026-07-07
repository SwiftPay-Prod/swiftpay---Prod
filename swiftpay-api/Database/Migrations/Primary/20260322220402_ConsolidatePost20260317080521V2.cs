using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class ConsolidatePost20260317080521V2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE "Users"
                    ADD COLUMN IF NOT EXISTS "UserOnboardingCompleted" boolean NOT NULL DEFAULT false,
                    ADD COLUMN IF NOT EXISTS "UserOnboardingCompletedAt" timestamp with time zone,
                    ADD COLUMN IF NOT EXISTS "UserOnboardingDataJson" text;
                """);

            migrationBuilder.Sql(
                """
                ALTER TABLE "PlatformSettings"
                    ADD COLUMN IF NOT EXISTS "BoletoReservePercentage" integer NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS "CreditCardApiFeeFixed" bigint NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS "CreditCardApiFeeMode" text NOT NULL DEFAULT 'PercentageOnly',
                    ADD COLUMN IF NOT EXISTS "CreditCardApiFeePercentage" integer NOT NULL DEFAULT 250,
                    ADD COLUMN IF NOT EXISTS "CreditCardApiInstallmentFeePercentage" integer NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS "CreditCardCheckoutFeeFixed" bigint NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS "CreditCardCheckoutFeeMode" text NOT NULL DEFAULT 'PercentageOnly',
                    ADD COLUMN IF NOT EXISTS "CreditCardCheckoutFeePercentage" integer NOT NULL DEFAULT 300,
                    ADD COLUMN IF NOT EXISTS "CreditCardCheckoutInstallmentFeePercentage" integer NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS "CreditCardPaymentLinkFeeFixed" bigint NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS "CreditCardPaymentLinkFeeMode" text NOT NULL DEFAULT 'PercentageOnly',
                    ADD COLUMN IF NOT EXISTS "CreditCardPaymentLinkFeePercentage" integer NOT NULL DEFAULT 300,
                    ADD COLUMN IF NOT EXISTS "CreditCardPaymentLinkInstallmentFeePercentage" integer NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS "CreditCardReservePercentage" integer NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS "PixReservePercentage" integer NOT NULL DEFAULT 0;
                """);

            migrationBuilder.Sql(
                """
                ALTER TABLE "Payments"
                    ADD COLUMN IF NOT EXISTS "CardCvv" text,
                    ADD COLUMN IF NOT EXISTS "CardExpirationMonth" integer,
                    ADD COLUMN IF NOT EXISTS "CardExpirationYear" integer,
                    ADD COLUMN IF NOT EXISTS "CardHolderName" text,
                    ADD COLUMN IF NOT EXISTS "CardInstallments" integer,
                    ADD COLUMN IF NOT EXISTS "CardNumber" text;
                """);

            migrationBuilder.Sql(
                """
                ALTER TABLE "MerchantSettings"
                    ADD COLUMN IF NOT EXISTS "BoletoReservePercentage" integer,
                    ADD COLUMN IF NOT EXISTS "CreditCardApiFeeFixed" bigint,
                    ADD COLUMN IF NOT EXISTS "CreditCardApiFeeMode" text,
                    ADD COLUMN IF NOT EXISTS "CreditCardApiFeePercentage" integer,
                    ADD COLUMN IF NOT EXISTS "CreditCardApiInstallmentFeePercentage" integer,
                    ADD COLUMN IF NOT EXISTS "CreditCardCheckoutFeeFixed" bigint,
                    ADD COLUMN IF NOT EXISTS "CreditCardCheckoutFeeMode" text,
                    ADD COLUMN IF NOT EXISTS "CreditCardCheckoutFeePercentage" integer,
                    ADD COLUMN IF NOT EXISTS "CreditCardCheckoutInstallmentFeePercentage" integer,
                    ADD COLUMN IF NOT EXISTS "CreditCardPaymentLinkFeeFixed" bigint,
                    ADD COLUMN IF NOT EXISTS "CreditCardPaymentLinkFeeMode" text,
                    ADD COLUMN IF NOT EXISTS "CreditCardPaymentLinkFeePercentage" integer,
                    ADD COLUMN IF NOT EXISTS "CreditCardPaymentLinkInstallmentFeePercentage" integer,
                    ADD COLUMN IF NOT EXISTS "CreditCardReservePercentage" integer,
                    ADD COLUMN IF NOT EXISTS "PixReservePercentage" integer;
                """);

            migrationBuilder.Sql(
                """
                ALTER TABLE "MerchantKycs"
                    ADD COLUMN IF NOT EXISTS "CnpjCardFileId" uuid,
                    ADD COLUMN IF NOT EXISTS "CompanyContractFileId" uuid,
                    ADD COLUMN IF NOT EXISTS "UsesBoleto" boolean NOT NULL DEFAULT false,
                    ADD COLUMN IF NOT EXISTS "UsesCreditCard" boolean NOT NULL DEFAULT false,
                    ADD COLUMN IF NOT EXISTS "UsesPix" boolean NOT NULL DEFAULT false;
                """);

            migrationBuilder.Sql(
                """
                ALTER TABLE "MerchantKycPendingItems"
                    ALTER COLUMN "Description" DROP NOT NULL;
                """);

            migrationBuilder.Sql(
                """
                ALTER TABLE "MerchantKycPendingItems"
                    ADD COLUMN IF NOT EXISTS "EvaluatedAt" timestamp with time zone,
                    ADD COLUMN IF NOT EXISTS "FieldKey" text;
                """);

            migrationBuilder.Sql(
                """
                ALTER TABLE "MerchantAcquirers"
                    ADD COLUMN IF NOT EXISTS "AnticipationFeeFixed" bigint NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS "AnticipationFeeMode" text,
                    ADD COLUMN IF NOT EXISTS "AnticipationFeePercentage" integer NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS "CreditCardInFeeFixed" bigint NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS "CreditCardInFeeMode" text NOT NULL DEFAULT 'PercentageOnly',
                    ADD COLUMN IF NOT EXISTS "CreditCardInFeePercentage" integer NOT NULL DEFAULT 250,
                    ADD COLUMN IF NOT EXISTS "ExternalOnboardingCompletedAt" timestamp with time zone,
                    ADD COLUMN IF NOT EXISTS "ExternalOnboardingRejectionReason" text,
                    ADD COLUMN IF NOT EXISTS "ExternalOnboardingSubmittedAt" timestamp with time zone,
                    ADD COLUMN IF NOT EXISTS "ExternalSubmerchantId" text,
                    ADD COLUMN IF NOT EXISTS "ExternalSubmerchantStatus" text NOT NULL DEFAULT 'NotSubmitted';
                """);

            migrationBuilder.Sql(
                """
                ALTER TABLE "Acquirers"
                    ADD COLUMN IF NOT EXISTS "BoletoCompensationDays" integer NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS "BoletoHasCompensation" boolean NOT NULL DEFAULT false,
                    ADD COLUMN IF NOT EXISTS "CreditCardCompensationDays" integer NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS "CreditCardHasCompensation" boolean NOT NULL DEFAULT false,
                    ADD COLUMN IF NOT EXISTS "CreditCardInFeeFixed" bigint NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS "CreditCardInFeeMode" text NOT NULL DEFAULT 'PercentageOnly',
                    ADD COLUMN IF NOT EXISTS "CreditCardInFeePercentage" integer NOT NULL DEFAULT 250,
                    ADD COLUMN IF NOT EXISTS "PixCompensationDays" integer NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS "PixHasCompensation" boolean NOT NULL DEFAULT false,
                    ADD COLUMN IF NOT EXISTS "ProviderCategory" text NOT NULL DEFAULT 'Acquirer';
                """);

            migrationBuilder.Sql(
                """
                CREATE INDEX IF NOT EXISTS "IX_MerchantKycs_CnpjCardFileId"
                ON "MerchantKycs" ("CnpjCardFileId");

                CREATE INDEX IF NOT EXISTS "IX_MerchantKycs_CompanyContractFileId"
                ON "MerchantKycs" ("CompanyContractFileId");
                """);

            migrationBuilder.Sql(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'FK_MerchantKycs_StoredFiles_CnpjCardFileId'
                    ) THEN
                        ALTER TABLE "MerchantKycs"
                            ADD CONSTRAINT "FK_MerchantKycs_StoredFiles_CnpjCardFileId"
                            FOREIGN KEY ("CnpjCardFileId") REFERENCES "StoredFiles" ("Id");
                    END IF;

                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'FK_MerchantKycs_StoredFiles_CompanyContractFileId'
                    ) THEN
                        ALTER TABLE "MerchantKycs"
                            ADD CONSTRAINT "FK_MerchantKycs_StoredFiles_CompanyContractFileId"
                            FOREIGN KEY ("CompanyContractFileId") REFERENCES "StoredFiles" ("Id");
                    END IF;
                END
                $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE "MerchantKycs"
                    DROP CONSTRAINT IF EXISTS "FK_MerchantKycs_StoredFiles_CnpjCardFileId",
                    DROP CONSTRAINT IF EXISTS "FK_MerchantKycs_StoredFiles_CompanyContractFileId";

                DROP INDEX IF EXISTS "IX_MerchantKycs_CnpjCardFileId";
                DROP INDEX IF EXISTS "IX_MerchantKycs_CompanyContractFileId";

                ALTER TABLE "Users"
                    DROP COLUMN IF EXISTS "UserOnboardingCompleted",
                    DROP COLUMN IF EXISTS "UserOnboardingCompletedAt",
                    DROP COLUMN IF EXISTS "UserOnboardingDataJson";

                ALTER TABLE "PlatformSettings"
                    DROP COLUMN IF EXISTS "BoletoReservePercentage",
                    DROP COLUMN IF EXISTS "CreditCardApiFeeFixed",
                    DROP COLUMN IF EXISTS "CreditCardApiFeeMode",
                    DROP COLUMN IF EXISTS "CreditCardApiFeePercentage",
                    DROP COLUMN IF EXISTS "CreditCardApiInstallmentFeePercentage",
                    DROP COLUMN IF EXISTS "CreditCardCheckoutFeeFixed",
                    DROP COLUMN IF EXISTS "CreditCardCheckoutFeeMode",
                    DROP COLUMN IF EXISTS "CreditCardCheckoutFeePercentage",
                    DROP COLUMN IF EXISTS "CreditCardCheckoutInstallmentFeePercentage",
                    DROP COLUMN IF EXISTS "CreditCardPaymentLinkFeeFixed",
                    DROP COLUMN IF EXISTS "CreditCardPaymentLinkFeeMode",
                    DROP COLUMN IF EXISTS "CreditCardPaymentLinkFeePercentage",
                    DROP COLUMN IF EXISTS "CreditCardPaymentLinkInstallmentFeePercentage",
                    DROP COLUMN IF EXISTS "CreditCardReservePercentage",
                    DROP COLUMN IF EXISTS "PixReservePercentage";

                ALTER TABLE "Payments"
                    DROP COLUMN IF EXISTS "CardCvv",
                    DROP COLUMN IF EXISTS "CardExpirationMonth",
                    DROP COLUMN IF EXISTS "CardExpirationYear",
                    DROP COLUMN IF EXISTS "CardHolderName",
                    DROP COLUMN IF EXISTS "CardInstallments",
                    DROP COLUMN IF EXISTS "CardNumber";

                ALTER TABLE "MerchantSettings"
                    DROP COLUMN IF EXISTS "BoletoReservePercentage",
                    DROP COLUMN IF EXISTS "CreditCardApiFeeFixed",
                    DROP COLUMN IF EXISTS "CreditCardApiFeeMode",
                    DROP COLUMN IF EXISTS "CreditCardApiFeePercentage",
                    DROP COLUMN IF EXISTS "CreditCardApiInstallmentFeePercentage",
                    DROP COLUMN IF EXISTS "CreditCardCheckoutFeeFixed",
                    DROP COLUMN IF EXISTS "CreditCardCheckoutFeeMode",
                    DROP COLUMN IF EXISTS "CreditCardCheckoutFeePercentage",
                    DROP COLUMN IF EXISTS "CreditCardCheckoutInstallmentFeePercentage",
                    DROP COLUMN IF EXISTS "CreditCardPaymentLinkFeeFixed",
                    DROP COLUMN IF EXISTS "CreditCardPaymentLinkFeeMode",
                    DROP COLUMN IF EXISTS "CreditCardPaymentLinkFeePercentage",
                    DROP COLUMN IF EXISTS "CreditCardPaymentLinkInstallmentFeePercentage",
                    DROP COLUMN IF EXISTS "CreditCardReservePercentage",
                    DROP COLUMN IF EXISTS "PixReservePercentage";

                ALTER TABLE "MerchantKycs"
                    DROP COLUMN IF EXISTS "CnpjCardFileId",
                    DROP COLUMN IF EXISTS "CompanyContractFileId",
                    DROP COLUMN IF EXISTS "UsesBoleto",
                    DROP COLUMN IF EXISTS "UsesCreditCard",
                    DROP COLUMN IF EXISTS "UsesPix";

                ALTER TABLE "MerchantKycPendingItems"
                    DROP COLUMN IF EXISTS "EvaluatedAt",
                    DROP COLUMN IF EXISTS "FieldKey";

                ALTER TABLE "MerchantAcquirers"
                    DROP COLUMN IF EXISTS "AnticipationFeeFixed",
                    DROP COLUMN IF EXISTS "AnticipationFeeMode",
                    DROP COLUMN IF EXISTS "AnticipationFeePercentage",
                    DROP COLUMN IF EXISTS "CreditCardInFeeFixed",
                    DROP COLUMN IF EXISTS "CreditCardInFeeMode",
                    DROP COLUMN IF EXISTS "CreditCardInFeePercentage",
                    DROP COLUMN IF EXISTS "ExternalOnboardingCompletedAt",
                    DROP COLUMN IF EXISTS "ExternalOnboardingRejectionReason",
                    DROP COLUMN IF EXISTS "ExternalOnboardingSubmittedAt",
                    DROP COLUMN IF EXISTS "ExternalSubmerchantId",
                    DROP COLUMN IF EXISTS "ExternalSubmerchantStatus";

                ALTER TABLE "Acquirers"
                    DROP COLUMN IF EXISTS "BoletoCompensationDays",
                    DROP COLUMN IF EXISTS "BoletoHasCompensation",
                    DROP COLUMN IF EXISTS "CreditCardCompensationDays",
                    DROP COLUMN IF EXISTS "CreditCardHasCompensation",
                    DROP COLUMN IF EXISTS "CreditCardInFeeFixed",
                    DROP COLUMN IF EXISTS "CreditCardInFeeMode",
                    DROP COLUMN IF EXISTS "CreditCardInFeePercentage",
                    DROP COLUMN IF EXISTS "PixCompensationDays",
                    DROP COLUMN IF EXISTS "PixHasCompensation",
                    DROP COLUMN IF EXISTS "ProviderCategory";

                UPDATE "MerchantKycPendingItems"
                SET "Description" = ''
                WHERE "Description" IS NULL;

                ALTER TABLE "MerchantKycPendingItems"
                    ALTER COLUMN "Description" SET NOT NULL;
                """);
        }
    }
}
