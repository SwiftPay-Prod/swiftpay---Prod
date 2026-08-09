namespace swiftpay_api_core.Models.Settings;

public class EmailPlatformSettings
{
    public const string SectionName = "EmailPlatformSettings";

    public bool Enabled { get; set; }
    public string FirebaseProjectId { get; set; } = string.Empty;
    public string? FirestoreEmulatorHost { get; set; }
    public string OutboxCollection { get; set; } = "mailOutbox";
    public string QuotaCollection { get; set; } = "mailQuota";
    public string QuotaReservationCollection { get; set; } = "mailQuotaReservations";
    public string ControlCollection { get; set; } = "mailWorkerControl";
    public int WorkerBatchSize { get; set; } = 25;
    public int RecoveryIntervalSeconds { get; set; } = 60;
    public int LeaseSeconds { get; set; } = 60;
    public int MinimumLeaseBeforeProviderSeconds { get; set; } = 20;
    public int ProviderTimeoutSeconds { get; set; } = 15;
    public int RetryBaseSeconds { get; set; } = 15;
    public int RetryMaximumSeconds { get; set; } = 3600;
    public int MaximumRetryableFailures { get; set; } = 8;
    public int MaximumAmbiguousAttempts { get; set; } = 8;
    public int ProviderIdempotencyWindowHours { get; set; } = 23;
    public int DailyQuota { get; set; } = 100;
    public int NotificationDailyQuota { get; set; } = 70;
    public int CleanupBatchSize { get; set; } = 200;
    public int PayloadRetentionDays { get; set; } = 30;
    public int SafeMetadataRetentionDays { get; set; } = 180;
    public string WorkerId { get; set; } = $"{Environment.MachineName}-{Environment.ProcessId}";
    public string FromAddress { get; set; } = "SwiftPay <noreply@swiftpayment.info>";
    public string? ReplyToAddress { get; set; }
    public string[] ContinueUrlAllowedHosts { get; set; } = ["swiftpayment.info", "www.swiftpayment.info"];
    public int RelayBatchSize { get; set; } = 20;
    public int RelayPollingIntervalSeconds { get; set; } = 30;
    public int RelayLeaseSeconds { get; set; } = 60;
    public int RelayRetryBaseSeconds { get; set; } = 15;
    public int RelayRetryMaximumSeconds { get; set; } = 3600;
    public int RelayMaximumAttempts { get; set; } = 8;
}
