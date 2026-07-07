using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class SeedLegacyAcquirerHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Seed legacy history records for existing MerchantAcquirers
            // This creates a history entry for each merchant-acquirer relationship that existed before history tracking
            migrationBuilder.Sql(@"
                INSERT INTO ""MerchantAcquirerChangeHistories"" (
                    ""Id"",
                    ""MerchantId"",
                    ""Action"",
                    ""PreviousAcquirerId"",
                    ""PreviousAcquirerName"",
                    ""NewAcquirerId"",
                    ""NewAcquirerName"",
                    ""MerchantAcquirerId"",
                    ""ChangedByUserId"",
                    ""Reason"",
                    ""IsLegacyRecord"",
                    ""Notes"",
                    ""CreatedAt"",
                    ""UpdatedAt""
                )
                SELECT 
                    gen_random_uuid(),
                    ma.""MerchantId"",
                    'LegacyMigration',
                    NULL,
                    NULL,
                    ma.""AcquirerId"",
                    a.""Name"",
                    ma.""Id"",
                    NULL,
                    NULL,
                    TRUE,
                    'Registro migrado automaticamente - adquirente estava vinculada antes do rastreamento de histórico',
                    ma.""CreatedAt"",
                    NOW()
                FROM ""MerchantAcquirers"" ma
                INNER JOIN ""Acquirers"" a ON a.""Id"" = ma.""AcquirerId""
                WHERE NOT EXISTS (
                    SELECT 1 FROM ""MerchantAcquirerChangeHistories"" h 
                    WHERE h.""MerchantAcquirerId"" = ma.""Id""
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove only legacy records created by this migration
            migrationBuilder.Sql(@"
                DELETE FROM ""MerchantAcquirerChangeHistories"" 
                WHERE ""IsLegacyRecord"" = TRUE 
                AND ""Action"" = 'LegacyMigration';
            ");
        }
    }
}
