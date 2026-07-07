using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class PaymentLinkDeferredStartFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PaymentLinks_Payments_PaymentId",
                table: "PaymentLinks");

            migrationBuilder.DropIndex(
                name: "IX_PaymentLinks_PaymentId",
                table: "PaymentLinks");

            migrationBuilder.AlterColumn<Guid>(
                name: "PaymentId",
                table: "PaymentLinks",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<long>(
                name: "Amount",
                table: "PaymentLinks",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<DateTime>(
                name: "BoletoDueDate",
                table: "PaymentLinks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BoletoInstructions",
                table: "PaymentLinks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CallbackUrl",
                table: "PaymentLinks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "PaymentLinks",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "CustomerId",
                table: "PaymentLinks",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "PaymentLinks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EnabledMethods",
                table: "PaymentLinks",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "PixExpirationMinutes",
                table: "PaymentLinks",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentLinks_PaymentId",
                table: "PaymentLinks",
                column: "PaymentId");

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentLinks_Payments_PaymentId",
                table: "PaymentLinks",
                column: "PaymentId",
                principalTable: "Payments",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PaymentLinks_Payments_PaymentId",
                table: "PaymentLinks");

            migrationBuilder.DropIndex(
                name: "IX_PaymentLinks_PaymentId",
                table: "PaymentLinks");

            migrationBuilder.DropColumn(
                name: "Amount",
                table: "PaymentLinks");

            migrationBuilder.DropColumn(
                name: "BoletoDueDate",
                table: "PaymentLinks");

            migrationBuilder.DropColumn(
                name: "BoletoInstructions",
                table: "PaymentLinks");

            migrationBuilder.DropColumn(
                name: "CallbackUrl",
                table: "PaymentLinks");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "PaymentLinks");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "PaymentLinks");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "PaymentLinks");

            migrationBuilder.DropColumn(
                name: "EnabledMethods",
                table: "PaymentLinks");

            migrationBuilder.DropColumn(
                name: "PixExpirationMinutes",
                table: "PaymentLinks");

            migrationBuilder.AlterColumn<Guid>(
                name: "PaymentId",
                table: "PaymentLinks",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentLinks_PaymentId",
                table: "PaymentLinks",
                column: "PaymentId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentLinks_Payments_PaymentId",
                table: "PaymentLinks",
                column: "PaymentId",
                principalTable: "Payments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
