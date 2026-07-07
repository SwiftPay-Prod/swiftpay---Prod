using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Users.ReadOnboarding;

public sealed class ReadOnboardingResponse : BaseResponse<ReadOnboardingData>;

public sealed class ReadOnboardingData
{
    public bool Completed { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<string> Discovery { get; set; } = [];
    public string? DiscoveryOther { get; set; }
    public List<string> Channels { get; set; } = [];
    public string? ChannelsOther { get; set; }
    public List<string> Goals { get; set; } = [];
    public string? GoalsOther { get; set; }
}

public sealed class UserOnboardingPayload
{
    public List<string> Discovery { get; set; } = [];
    public string? DiscoveryOther { get; set; }
    public List<string> Channels { get; set; } = [];
    public string? ChannelsOther { get; set; }
    public List<string> Goals { get; set; } = [];
    public string? GoalsOther { get; set; }
}
