namespace safefy_api_payment.Constants;

public static class WebhookEvents
{
    public static class Cashout
    {
        public const string Completed = "cashout.completed";
        public const string Failed = "cashout.failed";
        public const string Rejected = "cashout.rejected";
        public const string Cancelled = "cashout.cancelled";
    }
}
