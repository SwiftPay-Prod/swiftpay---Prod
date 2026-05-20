using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Models.Messages;

public class ProcessRankingMessage
{
    public ApiEnvironment Environment { get; set; }
    public RankingPeriod Period { get; set; }
}
