using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace swiftpay_api.Database.Migrations.Primary
{
    /// <inheritdoc />
    public partial class AddEmailIntentsOutbox : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "email_intents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DedupeKey = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    RequestHash = table.Column<string>(type: "character(64)", nullable: false),
                    EnvelopeHash = table.Column<string>(type: "character(64)", nullable: true),
                    IntentKind = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    MessageType = table.Column<string>(type: "character varying(96)", maxLength: 96, nullable: false),
                    DeliveryClass = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    TemplateVersion = table.Column<int>(type: "integer", nullable: false),
                    RecipientAddress = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    OwnerType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    OwnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestPayloadJson = table.Column<string>(type: "jsonb", nullable: false),
                    AuthActionType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    FirebaseUid = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    ContinueUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    CooldownWindowUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CorrelationId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    State = table.Column<string>(type: "character varying(48)", maxLength: 48, nullable: false),
                    MaterializationAttemptCount = table.Column<int>(type: "integer", nullable: false),
                    NextMaterializationAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MaterializationLeaseToken = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    MaterializationLeaseUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MaterializedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Subject = table.Column<string>(type: "character varying(998)", maxLength: 998, nullable: true),
                    HtmlBody = table.Column<string>(type: "character varying(131072)", maxLength: 131072, nullable: true),
                    TextBody = table.Column<string>(type: "character varying(131072)", maxLength: 131072, nullable: true),
                    ActionLink = table.Column<string>(type: "character varying(8192)", maxLength: 8192, nullable: true),
                    SendBefore = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PublishAttemptCount = table.Column<int>(type: "integer", nullable: false),
                    NextPublishAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PublishLeaseToken = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    PublishLeaseUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PublishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastErrorClass = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    LastErrorCode = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    LastErrorAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TerminalStatus = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    TerminalErrorCode = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    TerminalOccurredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ProviderAcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TerminalRecordedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_email_intents", x => x.Id);
                    table.CheckConstraint("CK_email_intents_Attempts_NonNegative", "\"MaterializationAttemptCount\" >= 0 AND \"PublishAttemptCount\" >= 0");
                    table.CheckConstraint("CK_email_intents_EnvelopeHash_Length", "\"EnvelopeHash\" IS NULL OR length(\"EnvelopeHash\") = 64");
                    table.CheckConstraint("CK_email_intents_RequestHash_Length", "length(\"RequestHash\") = 64");
                    table.CheckConstraint("CK_email_intents_TerminalSummary_Complete", "(\"TerminalStatus\" IS NULL AND \"TerminalOccurredAt\" IS NULL AND \"TerminalRecordedAt\" IS NULL) OR (\"TerminalStatus\" IS NOT NULL AND \"TerminalOccurredAt\" IS NOT NULL AND \"TerminalRecordedAt\" IS NOT NULL)");
                });

            migrationBuilder.CreateIndex(
                name: "IX_email_intents_MaterializationRecovery",
                table: "email_intents",
                columns: new[] { "State", "NextMaterializationAt", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_email_intents_Owner",
                table: "email_intents",
                columns: new[] { "OwnerType", "OwnerId", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_email_intents_PublishRecovery",
                table: "email_intents",
                columns: new[] { "State", "NextPublishAt", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_email_intents_TerminalSummary",
                table: "email_intents",
                columns: new[] { "TerminalStatus", "TerminalRecordedAt", "Id" });

            migrationBuilder.CreateIndex(
                name: "UX_email_intents_DedupeKey",
                table: "email_intents",
                column: "DedupeKey",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "email_intents");
        }
    }
}
