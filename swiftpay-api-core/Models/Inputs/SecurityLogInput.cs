using swiftpay_api_core.Models.Database;

namespace swiftpay_api_core.Models.Inputs;

public class SecurityLogInput
{
    public required SecurityLogAction Action { get; set; }

    public required SecurityLogStatus Status { get; set; }

    public Guid? UserId { get; set; }

    public string? UserEmail { get; set; }

    public string? Details { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public string? Location { get; set; }
}
