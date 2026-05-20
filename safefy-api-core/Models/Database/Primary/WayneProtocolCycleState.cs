using System.ComponentModel.DataAnnotations;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Models.Database;

public sealed class WayneProtocolCycleState
{
    [Key]
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;

    public long CycleNumber { get; set; } = 1;

    public int PositionInCycle { get; set; } = 0;

    public int MarkedInCycle { get; set; } = 0;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
