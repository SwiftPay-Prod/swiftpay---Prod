using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddFirebaseIdentityFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE "Users"
                ADD COLUMN IF NOT EXISTS "FirebaseUid" text NULL,
                ADD COLUMN IF NOT EXISTS "FirebaseProvider" text NULL;

                -- Email-first identity: enforce one platform account per email. Safe to create
                -- here (migration runs against a wiped/clean table in this rollout).
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Email"
                ON "Users" ("Email");
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE "Users"
                DROP COLUMN IF EXISTS "FirebaseUid",
                DROP COLUMN IF EXISTS "FirebaseProvider";

                DROP INDEX IF EXISTS "IX_Users_Email";
                """);
        }
    }
}
