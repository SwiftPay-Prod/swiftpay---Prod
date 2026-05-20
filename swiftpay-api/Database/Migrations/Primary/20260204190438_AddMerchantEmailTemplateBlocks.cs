using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddMerchantEmailTemplateBlocks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "ADD COLUMN IF NOT EXISTS \"Name\" character varying(100) NOT NULL DEFAULT 'Template padrão';");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "ADD COLUMN IF NOT EXISTS \"Enabled\" boolean NOT NULL DEFAULT true;");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "ADD COLUMN IF NOT EXISTS \"Subject\" character varying(200) NOT NULL DEFAULT '';");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "ADD COLUMN IF NOT EXISTS \"Blocks\" jsonb NOT NULL DEFAULT '[]'::jsonb;");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "ADD COLUMN IF NOT EXISTS \"PrimaryColor\" character varying(7) NOT NULL DEFAULT '#6366F1';");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "ADD COLUMN IF NOT EXISTS \"BackgroundColor\" character varying(7) NOT NULL DEFAULT '#F3F4F6';");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "ADD COLUMN IF NOT EXISTS \"ContainerBackgroundColor\" character varying(7) NOT NULL DEFAULT '#FFFFFF';");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "ADD COLUMN IF NOT EXISTS \"TextColorMode\" character varying(10) NOT NULL DEFAULT 'dark';");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "ADD COLUMN IF NOT EXISTS \"IsDefault\" boolean NOT NULL DEFAULT true;");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "ADD COLUMN IF NOT EXISTS \"Environment\" text NOT NULL DEFAULT 'Production';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "DROP COLUMN IF EXISTS \"IsDefault\";");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "DROP COLUMN IF EXISTS \"TextColorMode\";");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "DROP COLUMN IF EXISTS \"ContainerBackgroundColor\";");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "DROP COLUMN IF EXISTS \"BackgroundColor\";");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "DROP COLUMN IF EXISTS \"PrimaryColor\";");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "DROP COLUMN IF EXISTS \"Blocks\";");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "DROP COLUMN IF EXISTS \"Subject\";");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "DROP COLUMN IF EXISTS \"Enabled\";");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "DROP COLUMN IF EXISTS \"Name\";");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "DROP COLUMN IF EXISTS \"Environment\";");
        }
    }
}
