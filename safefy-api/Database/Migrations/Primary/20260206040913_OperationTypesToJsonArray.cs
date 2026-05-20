using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace safefy_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class OperationTypesToJsonArray : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OperationTypes",
                table: "Acquirers",
                type: "jsonb",
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE ""Acquirers""
                SET ""OperationTypes"" = jsonb_build_array(""OperationType"")
                WHERE ""OperationType"" IS NOT NULL;
            ");

            migrationBuilder.Sql(@"
                UPDATE ""Acquirers""
                SET ""OperationTypes"" = '[""White""]'::jsonb
                WHERE ""OperationTypes"" IS NULL;
            ");

            migrationBuilder.AlterColumn<string>(
                name: "OperationTypes",
                table: "Acquirers",
                type: "jsonb",
                nullable: false,
                defaultValue: "[\"White\"]");

            migrationBuilder.DropColumn(
                name: "OperationType",
                table: "Acquirers");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OperationType",
                table: "Acquirers",
                type: "text",
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE ""Acquirers""
                SET ""OperationType"" = ""OperationTypes""::jsonb->>0
                WHERE ""OperationTypes"" IS NOT NULL AND jsonb_array_length(""OperationTypes"") > 0;
            ");

            migrationBuilder.Sql(@"
                UPDATE ""Acquirers""
                SET ""OperationType"" = 'White'
                WHERE ""OperationType"" IS NULL;
            ");

            migrationBuilder.AlterColumn<string>(
                name: "OperationType",
                table: "Acquirers",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.DropColumn(
                name: "OperationTypes",
                table: "Acquirers");
        }
    }
}
