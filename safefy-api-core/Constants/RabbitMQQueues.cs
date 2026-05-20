namespace safefy_api_core.Constants;

public static class RabbitMQQueues
{
    public const string NotificationCreated = "safefy.notification.created";
    public const string RecordLedgerPending = "safefy.ledger.pending";
    public const string PaymentCompleted = "safefy.payment.completed";
    public const string ProcessCashout = "safefy.cashout.process";
    public const string SendWebhook = "safefy.webhook.send";
    public const string SendCashoutWebhook = "safefy.cashout.webhook.send";
    public const string ProcessMerchantDashboard = "safefy.dashboard.merchant";
    public const string ProcessAdminDashboard = "safefy.dashboard.admin";
    public const string ProcessAcquirerDashboard = "safefy.dashboard.acquirer";
    public const string ProcessPlatformBalance = "safefy.balance.platform";
    public const string SendPushNotification = "safefy.push.send";
    public const string CreateBulkUserNotification = "safefy.notification.bulk.create";
    public const string ProcessBankReconciliation = "safefy.reconciliation.process";
    public const string StartAllBankReconciliations = "safefy.reconciliation.start-all";
    public const string ProcessDigitalDelivery = "safefy.digital.delivery";
    public const string SendCustomerEmails = "safefy.email.customer";
    public const string ProcessPlatformPayout = "safefy.platform.payout.process";
    public const string ProcessPlatformPayoutItem = "safefy.platform.payout.item.process";
    public const string ReconcilePlatformBalance = "safefy.platform.reconcile";
    public const string ProcessRanking = "safefy.ranking.process";
    public const string ProcessReferralRanking = "safefy.ranking.referral.process";
    public const string ProcessAcquirerRanking = "safefy.ranking.acquirer.process";
    public const string ProcessReferralHistoricalCommission = "safefy.referral.historical.process";
    public const string GenerateFinancialScenarioDev = "safefy.dev.financial-scenario.generate";
}
