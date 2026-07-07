using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Logs
{
    /// <inheritdoc />
    public partial class InitialLogDb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AcquirerWebhookLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    AcquirerId = table.Column<Guid>(type: "uuid", nullable: true),
                    AcquirerType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    AcquirerCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    HttpMethod = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Endpoint = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    QueryString = table.Column<string>(type: "text", nullable: true),
                    RequestHeaders = table.Column<string>(type: "text", nullable: true),
                    RequestBody = table.Column<string>(type: "text", nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Location = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CorrelationId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ContentType = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ContentLength = table.Column<long>(type: "bigint", nullable: true),
                    StatusCode = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AcquirerWebhookLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ApiLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantName = table.Column<string>(type: "text", nullable: true),
                    MerchantDocument = table.Column<string>(type: "text", nullable: true),
                    CredentialId = table.Column<Guid>(type: "uuid", nullable: true),
                    HttpMethod = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Endpoint = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    StatusCode = table.Column<int>(type: "integer", nullable: false),
                    Action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Location = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Details = table.Column<string>(type: "character varying(10000)", maxLength: 10000, nullable: true),
                    ErrorCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    RequestBody = table.Column<string>(type: "text", nullable: true),
                    ResponseBody = table.Column<string>(type: "text", nullable: true),
                    AcquirerId = table.Column<Guid>(type: "uuid", nullable: true),
                    AcquirerType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ResourceId = table.Column<Guid>(type: "uuid", nullable: true),
                    ResourceType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ResponseTimeMs = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApiLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EmailLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    MerchantId = table.Column<Guid>(type: "uuid", nullable: true),
                    To = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Subject = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Template = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ErrorMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Parameters = table.Column<string>(type: "text", nullable: true),
                    ServiceName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SendTimeMs = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SecurityLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    UserEmail = table.Column<string>(type: "text", nullable: true),
                    Action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Location = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Details = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: true),
                    ServiceName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SecurityLogs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AcquirerWebhookLogs_AcquirerCode",
                table: "AcquirerWebhookLogs",
                column: "AcquirerCode");

            migrationBuilder.CreateIndex(
                name: "IX_AcquirerWebhookLogs_AcquirerId",
                table: "AcquirerWebhookLogs",
                column: "AcquirerId");

            migrationBuilder.CreateIndex(
                name: "IX_AcquirerWebhookLogs_AcquirerType",
                table: "AcquirerWebhookLogs",
                column: "AcquirerType");

            migrationBuilder.CreateIndex(
                name: "IX_AcquirerWebhookLogs_AcquirerType_CreatedAt",
                table: "AcquirerWebhookLogs",
                columns: new[] { "AcquirerType", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AcquirerWebhookLogs_CreatedAt",
                table: "AcquirerWebhookLogs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AcquirerWebhookLogs_IpAddress",
                table: "AcquirerWebhookLogs",
                column: "IpAddress");

            migrationBuilder.CreateIndex(
                name: "IX_AcquirerWebhookLogs_StatusCode",
                table: "AcquirerWebhookLogs",
                column: "StatusCode");

            migrationBuilder.CreateIndex(
                name: "IX_ApiLogs_AcquirerId",
                table: "ApiLogs",
                column: "AcquirerId");

            migrationBuilder.CreateIndex(
                name: "IX_ApiLogs_AcquirerType",
                table: "ApiLogs",
                column: "AcquirerType");

            migrationBuilder.CreateIndex(
                name: "IX_ApiLogs_Action",
                table: "ApiLogs",
                column: "Action");

            migrationBuilder.CreateIndex(
                name: "IX_ApiLogs_CreatedAt",
                table: "ApiLogs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ApiLogs_CredentialId",
                table: "ApiLogs",
                column: "CredentialId");

            migrationBuilder.CreateIndex(
                name: "IX_ApiLogs_IpAddress",
                table: "ApiLogs",
                column: "IpAddress");

            migrationBuilder.CreateIndex(
                name: "IX_ApiLogs_MerchantId",
                table: "ApiLogs",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_ApiLogs_MerchantId_Action_CreatedAt",
                table: "ApiLogs",
                columns: new[] { "MerchantId", "Action", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ApiLogs_MerchantId_StatusCode_CreatedAt",
                table: "ApiLogs",
                columns: new[] { "MerchantId", "StatusCode", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ApiLogs_Status",
                table: "ApiLogs",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ApiLogs_StatusCode",
                table: "ApiLogs",
                column: "StatusCode");

            migrationBuilder.CreateIndex(
                name: "IX_EmailLogs_CreatedAt",
                table: "EmailLogs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_EmailLogs_MerchantId",
                table: "EmailLogs",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailLogs_Status",
                table: "EmailLogs",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_EmailLogs_Template",
                table: "EmailLogs",
                column: "Template");

            migrationBuilder.CreateIndex(
                name: "IX_EmailLogs_UserId",
                table: "EmailLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailLogs_UserId_Template_CreatedAt",
                table: "EmailLogs",
                columns: new[] { "UserId", "Template", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_SecurityLogs_Action",
                table: "SecurityLogs",
                column: "Action");

            migrationBuilder.CreateIndex(
                name: "IX_SecurityLogs_CreatedAt",
                table: "SecurityLogs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_SecurityLogs_ServiceName",
                table: "SecurityLogs",
                column: "ServiceName");

            migrationBuilder.CreateIndex(
                name: "IX_SecurityLogs_Status",
                table: "SecurityLogs",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_SecurityLogs_UserId",
                table: "SecurityLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SecurityLogs_UserId_Action_CreatedAt",
                table: "SecurityLogs",
                columns: new[] { "UserId", "Action", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AcquirerWebhookLogs");

            migrationBuilder.DropTable(
                name: "ApiLogs");

            migrationBuilder.DropTable(
                name: "EmailLogs");

            migrationBuilder.DropTable(
                name: "SecurityLogs");
        }
    }
}
