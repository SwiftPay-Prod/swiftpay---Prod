using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using safefy_api_core.Database;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    [DbContext(typeof(PrimaryDbContext))]
    [Migration("20260222103000_BackfillLegacyMerchantAccountMerchantAcquirerId")]
    public partial class BackfillLegacyMerchantAccountMerchantAcquirerId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
WITH merchants_without_active AS (
    SELECT ma.""MerchantId""
    FROM ""MerchantAcquirers"" ma
    GROUP BY ma.""MerchantId""
    HAVING BOOL_OR(ma.""IsActive"") = FALSE
), ranked_active AS (
    SELECT ma.""Id"",
           ROW_NUMBER() OVER (
               PARTITION BY ma.""MerchantId""
               ORDER BY COALESCE(ma.""ActivatedAt"", ma.""UpdatedAt"", ma.""CreatedAt"") DESC, ma.""Id"" DESC
           ) AS rn
    FROM ""MerchantAcquirers"" ma
    INNER JOIN merchants_without_active mwa ON mwa.""MerchantId"" = ma.""MerchantId""
)
UPDATE ""MerchantAcquirers"" ma
SET ""IsActive"" = TRUE,
    ""IsDefault"" = TRUE,
    ""ActivatedAt"" = COALESCE(ma.""ActivatedAt"", ma.""UpdatedAt"", ma.""CreatedAt"", NOW())
FROM ranked_active r
WHERE ma.""Id"" = r.""Id""
  AND r.rn = 1;
");

            migrationBuilder.Sql(@"
WITH active_ma AS (
    SELECT ma.""MerchantId"", ma.""Id""
    FROM ""MerchantAcquirers"" ma
    WHERE ma.""IsActive"" = TRUE
), dup_pairs AS (
    SELECT legacy.""Id"" AS ""LegacyId"",
           target.""Id"" AS ""TargetId"",
           legacy.""Balance"" AS ""LegacyBalance""
    FROM ""Accounts"" legacy
    INNER JOIN active_ma ama ON ama.""MerchantId"" = legacy.""MerchantId""
    INNER JOIN ""Accounts"" target
        ON target.""MerchantId"" = legacy.""MerchantId""
       AND target.""Type"" = legacy.""Type""
       AND target.""Environment"" = legacy.""Environment""
       AND target.""MerchantAcquirerId"" = ama.""Id""
    WHERE legacy.""MerchantAcquirerId"" IS NULL
      AND legacy.""Type"" IN ('MerchantAvailable', 'MerchantPending', 'MerchantBlocked', 'MerchantPayoutsOut')
)
UPDATE ""Accounts"" target
SET ""Balance"" = target.""Balance"" + dp.""LegacyBalance"",
    ""UpdatedAt"" = NOW()
FROM dup_pairs dp
WHERE target.""Id"" = dp.""TargetId"";
");

            migrationBuilder.Sql(@"
WITH active_ma AS (
    SELECT ma.""MerchantId"", ma.""Id""
    FROM ""MerchantAcquirers"" ma
    WHERE ma.""IsActive"" = TRUE
), dup_pairs AS (
    SELECT legacy.""Id"" AS ""LegacyId""
    FROM ""Accounts"" legacy
    INNER JOIN active_ma ama ON ama.""MerchantId"" = legacy.""MerchantId""
    INNER JOIN ""Accounts"" target
        ON target.""MerchantId"" = legacy.""MerchantId""
       AND target.""Type"" = legacy.""Type""
       AND target.""Environment"" = legacy.""Environment""
       AND target.""MerchantAcquirerId"" = ama.""Id""
    WHERE legacy.""MerchantAcquirerId"" IS NULL
      AND legacy.""Type"" IN ('MerchantAvailable', 'MerchantPending', 'MerchantBlocked', 'MerchantPayoutsOut')
)
UPDATE ""Accounts"" legacy
SET ""Balance"" = 0,
    ""UpdatedAt"" = NOW()
FROM dup_pairs dp
WHERE legacy.""Id"" = dp.""LegacyId"";
");

            migrationBuilder.Sql(@"
UPDATE ""Accounts"" a
SET ""MerchantAcquirerId"" = ma.""Id"",
    ""UpdatedAt"" = NOW()
FROM ""MerchantAcquirers"" ma
WHERE a.""MerchantId"" = ma.""MerchantId""
  AND a.""MerchantId"" IS NOT NULL
  AND a.""MerchantAcquirerId"" IS NULL
  AND a.""Type"" IN ('MerchantAvailable', 'MerchantPending', 'MerchantBlocked', 'MerchantPayoutsOut')
  AND ma.""IsActive"" = TRUE
  AND NOT EXISTS (
      SELECT 1
      FROM ""Accounts"" existing
      WHERE existing.""MerchantId"" = a.""MerchantId""
        AND existing.""Type"" = a.""Type""
        AND existing.""Environment"" = a.""Environment""
        AND existing.""MerchantAcquirerId"" = ma.""Id""
  );
");

            migrationBuilder.Sql(@"
WITH fallback_ma AS (
    SELECT ma.""MerchantId"",
           ma.""Id"",
           ROW_NUMBER() OVER (
               PARTITION BY ma.""MerchantId""
               ORDER BY COALESCE(ma.""ActivatedAt"", ma.""UpdatedAt"", ma.""CreatedAt"") DESC, ma.""Id"" DESC
           ) AS rn
    FROM ""MerchantAcquirers"" ma
)
UPDATE ""Accounts"" a
SET ""MerchantAcquirerId"" = f.""Id"",
    ""UpdatedAt"" = NOW()
FROM fallback_ma f
WHERE a.""MerchantId"" = f.""MerchantId""
  AND a.""MerchantId"" IS NOT NULL
  AND a.""MerchantAcquirerId"" IS NULL
  AND a.""Type"" IN ('MerchantAvailable', 'MerchantPending', 'MerchantBlocked', 'MerchantPayoutsOut')
    AND f.rn = 1
    AND NOT EXISTS (
            SELECT 1
            FROM ""Accounts"" existing
            WHERE existing.""MerchantId"" = a.""MerchantId""
                AND existing.""Type"" = a.""Type""
                AND existing.""Environment"" = a.""Environment""
                AND existing.""MerchantAcquirerId"" = f.""Id""
    );
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
