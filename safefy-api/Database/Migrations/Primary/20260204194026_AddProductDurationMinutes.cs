using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddProductDurationMinutes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE \"Products\" " +
                "ADD COLUMN IF NOT EXISTS \"DurationMinutes\" integer;");
            migrationBuilder.Sql(
                "ALTER TABLE \"Products\" " +
                "ADD COLUMN IF NOT EXISTS \"LocationType\" text;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE \"Products\" " +
                "DROP COLUMN IF EXISTS \"LocationType\";");
            migrationBuilder.Sql(
                "ALTER TABLE \"Products\" " +
                "DROP COLUMN IF EXISTS \"DurationMinutes\";");
        }
    }
}
