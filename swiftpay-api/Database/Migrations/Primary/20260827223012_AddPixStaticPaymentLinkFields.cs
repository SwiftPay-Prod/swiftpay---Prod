using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddPixStaticPaymentLinkFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PixLinkMode",
                table: "PaymentLinks",
                type: "text",
                nullable: false,
                defaultValue: "Dynamic");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PixLinkMode",
                table: "PaymentLinks");
        }
    }
}
