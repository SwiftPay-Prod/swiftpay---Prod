using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class ChangeBulletinReactionToEmoji : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_BulletinReactions_BulletinId_UserId",
                table: "BulletinReactions");

            migrationBuilder.DropColumn(
                name: "ReactionType",
                table: "BulletinReactions");

            migrationBuilder.AddColumn<string>(
                name: "Emoji",
                table: "BulletinReactions",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_BulletinReactions_BulletinId_UserId_Emoji",
                table: "BulletinReactions",
                columns: new[] { "BulletinId", "UserId", "Emoji" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_BulletinReactions_BulletinId_UserId_Emoji",
                table: "BulletinReactions");

            migrationBuilder.DropColumn(
                name: "Emoji",
                table: "BulletinReactions");

            migrationBuilder.AddColumn<string>(
                name: "ReactionType",
                table: "BulletinReactions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_BulletinReactions_BulletinId_UserId",
                table: "BulletinReactions",
                columns: new[] { "BulletinId", "UserId" },
                unique: true);
        }
    }
}
