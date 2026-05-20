using System.Text.Json;

namespace safefy_api_core.Models.UserOnboarding;

public sealed class UserOnboardingConfig
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

public static class UserOnboardingConfigSerializer
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static UserOnboardingConfig ParseOrDefault(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new UserOnboardingConfig();
        }

        try
        {
            return JsonSerializer.Deserialize<UserOnboardingConfig>(json, SerializerOptions) ?? new UserOnboardingConfig();
        }
        catch
        {
            return new UserOnboardingConfig();
        }
    }

    public static string Serialize(UserOnboardingConfig config)
    {
        return JsonSerializer.Serialize(config, SerializerOptions);
    }
}
