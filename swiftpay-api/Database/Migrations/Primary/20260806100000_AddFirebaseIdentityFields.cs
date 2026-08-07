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
                """);
        }
    }
}
