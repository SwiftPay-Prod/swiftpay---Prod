using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddUniqueIndexPayoutSettlementOut : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                WITH duplicate_transactions AS (
                    SELECT ranked."Id"
                    FROM (
                        SELECT
                            lt."Id",
                            ROW_NUMBER() OVER (
                                PARTITION BY lt."PayoutId", lt."Operation"
                                ORDER BY lt."CreatedAt", lt."Id"
                            ) AS row_number
                        FROM "LedgerTransactions" lt
                        WHERE lt."PayoutId" IS NOT NULL
                          AND lt."Operation" = 'SettlementOut'
                    ) ranked
                    WHERE ranked.row_number > 1
                ),
                account_balance_reversals AS (
                    SELECT
                        le."AccountId",
                        SUM(CASE
                            WHEN le."Type" = 'Credit' THEN -le."Amount"
                            ELSE le."Amount"
                        END) AS "Delta"
                    FROM "LedgerEntries" le
                    INNER JOIN duplicate_transactions dt ON dt."Id" = le."LedgerTransactionId"
                    GROUP BY le."AccountId"
                )
                UPDATE "Accounts" a
                SET
                    "Balance" = a."Balance" + abr."Delta",
                    "UpdatedAt" = NOW()
                FROM account_balance_reversals abr
                WHERE a."Id" = abr."AccountId";
                """);

            migrationBuilder.Sql(
                """
                WITH duplicate_transactions AS (
                    SELECT ranked."Id"
                    FROM (
                        SELECT
                            lt."Id",
                            ROW_NUMBER() OVER (
                                PARTITION BY lt."PayoutId", lt."Operation"
                                ORDER BY lt."CreatedAt", lt."Id"
                            ) AS row_number
                        FROM "LedgerTransactions" lt
                        WHERE lt."PayoutId" IS NOT NULL
                          AND lt."Operation" = 'SettlementOut'
                    ) ranked
                    WHERE ranked.row_number > 1
                ),
                merchant_payout_reversals AS (
                    SELECT
                        a."MerchantId",
                        a."Environment",
                        SUM(le."Amount") AS "Delta"
                    FROM "LedgerEntries" le
                    INNER JOIN duplicate_transactions dt ON dt."Id" = le."LedgerTransactionId"
                    INNER JOIN "Accounts" a ON a."Id" = le."AccountId"
                    WHERE a."Type" = 'MerchantPayoutsOut'
                      AND le."Type" = 'Credit'
                      AND a."MerchantId" IS NOT NULL
                    GROUP BY a."MerchantId", a."Environment"
                )
                UPDATE "MerchantBalances" mb
                SET
                    "LifetimePayouts" = mb."LifetimePayouts" - mpr."Delta",
                    "UpdatedAt" = NOW()
                FROM merchant_payout_reversals mpr
                WHERE mb."MerchantId" = mpr."MerchantId"
                  AND mb."Environment" = mpr."Environment";
                """);

            migrationBuilder.Sql(
                """
                WITH duplicate_transactions AS (
                    SELECT ranked."Id"
                    FROM (
                        SELECT
                            lt."Id",
                            ROW_NUMBER() OVER (
                                PARTITION BY lt."PayoutId", lt."Operation"
                                ORDER BY lt."CreatedAt", lt."Id"
                            ) AS row_number
                        FROM "LedgerTransactions" lt
                        WHERE lt."PayoutId" IS NOT NULL
                          AND lt."Operation" = 'SettlementOut'
                    ) ranked
                    WHERE ranked.row_number > 1
                )
                DELETE FROM "LedgerEntries" le
                USING duplicate_transactions dt
                WHERE le."LedgerTransactionId" = dt."Id";
                """);

            migrationBuilder.Sql(
                """
                WITH duplicate_transactions AS (
                    SELECT ranked."Id"
                    FROM (
                        SELECT
                            lt."Id",
                            ROW_NUMBER() OVER (
                                PARTITION BY lt."PayoutId", lt."Operation"
                                ORDER BY lt."CreatedAt", lt."Id"
                            ) AS row_number
                        FROM "LedgerTransactions" lt
                        WHERE lt."PayoutId" IS NOT NULL
                          AND lt."Operation" = 'SettlementOut'
                    ) ranked
                    WHERE ranked.row_number > 1
                )
                DELETE FROM "LedgerTransactions" lt
                USING duplicate_transactions dt
                WHERE lt."Id" = dt."Id";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_LedgerTransactions_PayoutId_SettlementOut_Unique",
                table: "LedgerTransactions",
                columns: new[] { "PayoutId", "Operation" },
                unique: true,
                filter: "\"PayoutId\" IS NOT NULL AND \"Operation\" = 'SettlementOut'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_LedgerTransactions_PayoutId_SettlementOut_Unique",
                table: "LedgerTransactions");
        }
    }
}
