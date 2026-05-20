namespace safefy_api_payment.Clients.IHubBanking.Models.Webhook;

public static class IHubWebhookEvents
{
    public const string CashInPaid = "cashin.paid";
    public const string CashInRefunded = "cashin.refunded";
    public const string CashInFailed = "cashin.failed";
    public const string CashInCancelled = "cashin.cancelled";
    public const string CashInCanceled = "cashin.canceled";
    public const string CashInExpired = "cashin.expired";
    public const string CashOutSuccess = "cashout.success";
    public const string CashOutFailed = "cashout.failed";
    public const string CashOutError = "cashout.error";
    public const string CashOutRejected = "cashout.rejected";
    public const string CashOutReject = "cashout.reject";
    public const string CashOutCancelled = "cashout.cancelled";
    public const string CashOutCanceled = "cashout.canceled";
    public const string CashOutReturned = "cashout.returned";
    public const string InfractionUpdated = "infraction.updated";

    public static string Normalize(string? value)
    {
        return IHubWebhookEventTypeConverter.Normalize(value);
    }

    public static IHubWebhookEventType ToEventType(string? value)
    {
        return Normalize(value) switch
        {
            CashInPaid => IHubWebhookEventType.CashInPaid,
            CashInRefunded => IHubWebhookEventType.CashInRefunded,
            CashInFailed => IHubWebhookEventType.CashInFailed,
            CashInCancelled or CashInCanceled => IHubWebhookEventType.CashInCancelled,
            CashInExpired => IHubWebhookEventType.CashInExpired,
            CashOutSuccess => IHubWebhookEventType.CashOutSuccess,
            CashOutFailed => IHubWebhookEventType.CashOutFailed,
            CashOutError => IHubWebhookEventType.CashOutError,
            CashOutRejected or CashOutReject or CashOutCancelled or CashOutCanceled => IHubWebhookEventType.CashOutRejected,
            CashOutReturned => IHubWebhookEventType.CashOutReturned,
            InfractionUpdated => IHubWebhookEventType.InfractionUpdated,
            _ => IHubWebhookEventType.Unknown
        };
    }
}
