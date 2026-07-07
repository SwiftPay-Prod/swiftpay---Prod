using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class RemoveLegacyMerchantEmailTemplateFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "DROP COLUMN IF EXISTS \"Greeting\";");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "DROP COLUMN IF EXISTS \"IntroText\";");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "DROP COLUMN IF EXISTS \"ItemsSectionTitle\";");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "DROP COLUMN IF EXISTS \"OutroText\";");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "DROP COLUMN IF EXISTS \"FooterText\";");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "DROP COLUMN IF EXISTS \"LogoUrl\";");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "DROP COLUMN IF EXISTS \"BannerImageUrl\";");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "DROP COLUMN IF EXISTS \"ShowProductImages\";");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "DROP COLUMN IF EXISTS \"ShowPrices\";");
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "DROP COLUMN IF EXISTS \"Layout\";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "ADD COLUMN IF NOT EXISTS \"Greeting\" character varying(500) NOT NULL DEFAULT '';" );
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "ADD COLUMN IF NOT EXISTS \"IntroText\" character varying(1000) NOT NULL DEFAULT '';" );
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "ADD COLUMN IF NOT EXISTS \"ItemsSectionTitle\" character varying(500) NOT NULL DEFAULT '';" );
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "ADD COLUMN IF NOT EXISTS \"OutroText\" character varying(1000) NOT NULL DEFAULT '';" );
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "ADD COLUMN IF NOT EXISTS \"FooterText\" character varying(500) NOT NULL DEFAULT '';" );
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "ADD COLUMN IF NOT EXISTS \"LogoUrl\" character varying(500) NULL;" );
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "ADD COLUMN IF NOT EXISTS \"BannerImageUrl\" character varying(500) NULL;" );
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "ADD COLUMN IF NOT EXISTS \"ShowProductImages\" boolean NOT NULL DEFAULT false;" );
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "ADD COLUMN IF NOT EXISTS \"ShowPrices\" boolean NOT NULL DEFAULT false;" );
            migrationBuilder.Sql(
                "ALTER TABLE \"MerchantEmailTemplates\" " +
                "ADD COLUMN IF NOT EXISTS \"Layout\" text NOT NULL DEFAULT '';" );
        }
    }
}
