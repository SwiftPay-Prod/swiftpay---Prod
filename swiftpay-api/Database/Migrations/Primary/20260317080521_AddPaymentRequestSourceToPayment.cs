using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddPaymentRequestSourceToPayment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RequestSource",
                table: "Payments",
                type: "text",
                nullable: false,
                defaultValue: "Api");

            migrationBuilder.Sql("""
                UPDATE "Payments"
                SET "RequestSource" = 'Checkout'
                WHERE "OrderId" IN (
                    SELECT "Id"
                    FROM "Orders"
                    WHERE "CheckoutId" IS NOT NULL
                );
                """);

            migrationBuilder.Sql("""
                UPDATE "Payments" p
                SET "RequestSource" = 'PaymentLink'
                WHERE EXISTS (
                    SELECT 1
                    FROM "PaymentLinks" pl
                    WHERE pl."PaymentId" = p."Id"
                );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RequestSource",
                table: "Payments");
        }
    }
}
