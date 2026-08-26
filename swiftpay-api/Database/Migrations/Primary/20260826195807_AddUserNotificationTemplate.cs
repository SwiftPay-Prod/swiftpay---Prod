using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddUserNotificationTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserNotificationTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    StatusType = table.Column<string>(type: "text", nullable: true),
                    TitleTemplate = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    BodyTemplate = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserNotificationTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserNotificationTemplates_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserNotificationTemplates_UserId_Type_StatusType",
                table: "UserNotificationTemplates",
                columns: new[] { "UserId", "Type", "StatusType" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserNotificationTemplates");
        }
    }
}
