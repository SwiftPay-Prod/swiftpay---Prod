namespace swiftpay_api_core.Constants;

public static class UserOnboardingConstants
{
    public const string ConfigKeyPrefix = "user:onboarding";

    public static string BuildConfigKey(Guid userId) => $"{ConfigKeyPrefix}:{userId}";
}
