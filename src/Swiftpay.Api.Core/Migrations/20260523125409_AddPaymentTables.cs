using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Swiftpay.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantAcquirerId = table.Column<Guid>(type: "uuid", nullable: true),
                    Amount = table.Column<long>(type: "bigint", nullable: false),
                    PlatformFee = table.Column<long>(type: "bigint", nullable: false),
                    AcquirerFee = table.Column<long>(type: "bigint", nullable: false),
                    NetAmount = table.Column<long>(type: "bigint", nullable: false),
                    MerchantSettlementAmount = table.Column<long>(type: "bigint", nullable: false),
                    AcquirerNetAmount = table.Column<long>(type: "bigint", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Method = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ExternalId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    AcquirerPaymentId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    NotificationUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FailureReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Environment = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PaymentLinkId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RefundedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PaymentPix",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PaymentId = table.Column<Guid>(type: "uuid", nullable: false),
                    TxId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    QrCodePayload = table.Column<string>(type: "text", nullable: true),
                    QrCodeBase64 = table.Column<string>(type: "text", nullable: true),
                    CopyAndPaste = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    EndToEndId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PixKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PixKeyType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    PayerName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    PayerDocument = table.Column<string>(type: "character varying(18)", maxLength: 18, nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentPix", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentPix_Payments_PaymentId",
                        column: x => x.PaymentId,
                        principalTable: "Payments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PaymentPix_PaymentId",
                table: "PaymentPix",
                column: "PaymentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_AcquirerPaymentId",
                table: "Payments",
                column: "AcquirerPaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_ExternalId",
                table: "Payments",
                column: "ExternalId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_MerchantId",
                table: "Payments",
                column: "MerchantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PaymentPix");

            migrationBuilder.DropTable(
                name: "Payments");
        }
    }
}
