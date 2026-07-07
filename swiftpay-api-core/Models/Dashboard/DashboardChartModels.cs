namespace swiftpay_api_core.Models.Dashboard;

public sealed class MerchantDailyVolumeData
{
    public DateOnly Date { get; set; }
    public long Volume { get; set; }
    public int TransactionCount { get; set; }
}

public sealed class MerchantWeeklyVolumeData
{
    public int WeekNumber { get; set; }
    public string Label { get; set; } = string.Empty;
    public long Volume { get; set; }
    public int TransactionCount { get; set; }
}

public sealed class AdminMerchantDailyVolumeData
{
    public DateOnly Date { get; set; }
    public long Volume { get; set; }
    public long Fees { get; set; }
    public int TransactionCount { get; set; }
}

public sealed class AdminDailyVolumeData
{
    public DateOnly Date { get; set; }
    public long Volume { get; set; }
    public long Fees { get; set; }
    public long AcquirerFees { get; set; }
    public long PayoutFees { get; set; }
    public long PayoutAcquirerFees { get; set; }
    public int TransactionCount { get; set; }
    public int CompletedTransactions { get; set; }
    public int FailedTransactions { get; set; }
}

public sealed class AdminDailyRegistrationData
{
    public DateOnly Date { get; set; }
    public int NewUsers { get; set; }
    public int NewMerchants { get; set; }
}

public sealed class AdminAcquirerChartItem
{
    public string Date { get; set; } = string.Empty;
    public long Value { get; set; }
}
