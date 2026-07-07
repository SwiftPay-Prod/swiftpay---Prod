using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Messages;

public class ProcessRankingMessage
{
    public ApiEnvironment Environment { get; set; }
    public RankingPeriod Period { get; set; }
}
