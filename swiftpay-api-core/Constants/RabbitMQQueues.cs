namespace swiftpay_api_core.Constants;

public static class RabbitMQQueues
{
    public const string NotificationCreated = "swiftpay.notification.created";
    public const string RecordLedgerPending = "swiftpay.ledger.pending";
    public const string PaymentCompleted = "swiftpay.payment.completed";
    public const string ProcessCashout = "swiftpay.cashout.process";
    public const string SendWebhook = "swiftpay.webhook.send";
    public const string SendCashoutWebhook = "swiftpay.cashout.webhook.send";
    public const string ProcessMerchantDashboard = "swiftpay.dashboard.merchant";
    public const string ProcessAdminDashboard = "swiftpay.dashboard.admin";
    public const string ProcessAcquirerDashboard = "swiftpay.dashboard.acquirer";
    public const string ProcessPlatformBalance = "swiftpay.balance.platform";
    public const string SendPushNotification = "swiftpay.push.send";
    public const string CreateBulkUserNotification = "swiftpay.notification.bulk.create";
    public const string ProcessBankReconciliation = "swiftpay.reconciliation.process";
    public const string StartAllBankReconciliations = "swiftpay.reconciliation.start-all";
    public const string ProcessDigitalDelivery = "swiftpay.digital.delivery";
    public const string SendCustomerEmails = "swiftpay.email.customer";
    public const string ProcessPlatformPayout = "swiftpay.platform.payout.process";
    public const string ProcessPlatformPayoutItem = "swiftpay.platform.payout.item.process";
    public const string ReconcilePlatformBalance = "swiftpay.platform.reconcile";
    public const string ProcessRanking = "swiftpay.ranking.process";
    public const string ProcessReferralRanking = "swiftpay.ranking.referral.process";
    public const string ProcessAcquirerRanking = "swiftpay.ranking.acquirer.process";
    public const string ProcessReferralHistoricalCommission = "swiftpay.referral.historical.process";
    public const string GenerateFinancialScenarioDev = "swiftpay.dev.financial-scenario.generate";
}
