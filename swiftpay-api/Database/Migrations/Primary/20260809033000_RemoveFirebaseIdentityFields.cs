using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    public partial class RemoveFirebaseIdentityFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE "Users"
                DROP COLUMN IF EXISTS "FirebaseUid",
                DROP COLUMN IF EXISTS "FirebaseProvider";

                ALTER TABLE "email_intents"
                DROP COLUMN IF EXISTS "FirebaseUid";
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE "Users"
                ADD COLUMN IF NOT EXISTS "FirebaseUid" text NULL,
                ADD COLUMN IF NOT EXISTS "FirebaseProvider" text NULL;

                ALTER TABLE "email_intents"
                ADD COLUMN IF NOT EXISTS "FirebaseUid" character varying(128) NULL;
                """);
        }
    }
}
