using System.Globalization;

namespace swiftpay_api_core.Models.Email;

public enum EmailDeliveryClass
{
    Critical = 0,
    Notification = 1
}

public enum EmailIntentKind
{
    Template = 0,
    PlatformAuthAction = 1,
    PaymentAction = 2,
    AccountAction = 3,
    PayoutAction = 4,
    KycAction = 5,
    ReferralAction = 6
}
public enum EmailAuthActionType
{
    VerifyEmail = 0,
    PasswordReset = 1,
    EmailSignIn = 2
}

public enum EmailIntentState
{
    PendingMaterialization = 0,
    Materializing = 1,
    MaterializationRetry = 2,
    ReadyToPublish = 3,
    Publishing = 4,
    PublishRetry = 5,
    ConfigurationInvalid = 6,
    MaterializationFailed = 7,
    PublishConflict = 8,
    PublishFailed = 9,
    Published = 10
}

public enum EmailDeliveryTerminalStatus
{
    Accepted = 0,
    Failed = 1,
    DeadLetter = 2,
    DeliveryUnknown = 3
}

public enum EmailIntentOwnerType
{
    User = 0,
    Merchant = 1,
    Platform = 2
}

public enum EmailIntentDedupeFamily
{
    BusinessTransition = 0,
    ScheduledSummary = 1,
    ManualOperation = 2,
    SignupVerification = 3,
    VerificationResend = 4,
    PasswordReset = 5,
    DeviceVerification = 6,
    CashoutAccountAction = 7,
    ApiCredentialCode = 8,
    MerchantDeletion = 9,
    PasswordChange = 10,
    ReferralPixKeyChange = 11
}

public enum EmailMessageType
{
    KycApproved = 0,
    KycRejected = 1,
    KycComplement = 2,
    MerchantInactivated = 3,
    MerchantSuspended = 4,
    AdminPasswordReset = 5,
    EmailConfirmation = 6,
    PasswordReset = 7,
    DeviceVerification = 8,
    PasswordChanged = 9,
    AccountLocked = 10,
    DeviceAdded = 11,
    PayoutAccountActionVerification = 12,
    PayoutAccountCreated = 13,
    MerchantDeleted = 14,
    ApiCredentialCreated = 15,
    ApiCredentialRevoked = 16,
    ApiCredentialRegenerated = 17,
    ApiCredentialCode = 18,
    CustomHtml = 19,
    MerchantDeletionCode = 20,
    KycSubmitted = 21,
    PasswordChangeCode = 22,
    ReferralPayoutPixKeyVerification = 23,
    PayoutCompleted = 24,
    PayoutRequested = 25,
    PayoutRejected = 26
}

public readonly record struct EmailIntentOwner(EmailIntentOwnerType Type, Guid Id);

public readonly record struct EmailIntentHandle(Guid Id, EmailDeliveryClass DeliveryClass);
public sealed record EmailIntentAuthActionRequest
{
    public required EmailAuthActionType ActionType { get; init; }
    public required string ContinueUrl { get; init; }
}

public sealed record EmailIntentCustomHtmlRequest
{
    public required string Subject { get; init; }
    public required TrustedEmailHtmlValue Body { get; init; }
}


public sealed record EmailIntentAddRequest
{
    public required EmailIntentDedupeKey Dedupe { get; init; }
    public required EmailMessageType MessageType { get; init; }
    public required string RecipientAddress { get; init; }
    public required EmailIntentOwner Owner { get; init; }
    public required string CorrelationId { get; init; }
    public IReadOnlyDictionary<string, string>? Inputs { get; init; }
    public EmailIntentAuthActionRequest? AuthAction { get; init; }
    public EmailIntentCustomHtmlRequest? CustomHtml { get; init; }
}

public readonly record struct EmailIntentTerminalSummary(
    Guid MessageId,
    EmailDeliveryTerminalStatus Status,
    string? SafeErrorCode,
    DateTime OccurredAt,
    DateTime? ProviderAcceptedAt,
    DateTime RecordedAt);

public readonly record struct EmailIntentCatalogDefinition(
    EmailMessageType MessageType,
    EmailIntentKind IntentKind,
    EmailDeliveryClass DeliveryClass,
    int TemplateVersion,
    EmailAuthActionType? RequiredAuthActionType);

public readonly record struct EmailIntentDedupeKey
{
    private const int MaxSegmentLength = 160;

    private EmailIntentDedupeKey(
        EmailIntentDedupeFamily family,
        string value,
        DateTime? cooldownWindowUtc = null)
    {
        Family = family;
        Value = value;
        CooldownWindowUtc = cooldownWindowUtc;
    }

    public EmailIntentDedupeFamily Family { get; }
    public string Value { get; }
    public DateTime? CooldownWindowUtc { get; }

    public static EmailIntentDedupeKey BusinessTransition(
        EmailMessageType messageType,
        Guid aggregateId,
        Guid transitionId)
    {
        EnsureGuid(aggregateId, nameof(aggregateId));
        EnsureGuid(transitionId, nameof(transitionId));
        return new EmailIntentDedupeKey(
            EmailIntentDedupeFamily.BusinessTransition,
            $"{messageType}:{aggregateId:N}:{transitionId:N}");
    }

    public static EmailIntentDedupeKey ScheduledSummary(
        EmailMessageType messageType,
        Guid ownerId,
        DateTime periodStartUtc)
    {
        EnsureGuid(ownerId, nameof(ownerId));
        return new EmailIntentDedupeKey(
            EmailIntentDedupeFamily.ScheduledSummary,
            $"{messageType}:{ownerId:N}:{FormatUtc(periodStartUtc, nameof(periodStartUtc))}");
    }

    public static EmailIntentDedupeKey ManualOperation(
        EmailMessageType messageType,
        Guid operationId)
    {
        EnsureGuid(operationId, nameof(operationId));
        return new EmailIntentDedupeKey(
            EmailIntentDedupeFamily.ManualOperation,
            $"{messageType}:{operationId:N}");
    }

    public static EmailIntentDedupeKey SignupVerification(string normalizedEmail, string signupVersion)
    {
        return new EmailIntentDedupeKey(
            EmailIntentDedupeFamily.SignupVerification,
            $"verify:{NormalizeSegment(normalizedEmail, nameof(normalizedEmail))}:{NormalizeSegment(signupVersion, nameof(signupVersion))}");
    }

    public static EmailIntentDedupeKey VerificationResend(string normalizedEmail, DateTime cooldownWindowUtc)
    {
        var window = RequireUtc(cooldownWindowUtc, nameof(cooldownWindowUtc));
        return new EmailIntentDedupeKey(
            EmailIntentDedupeFamily.VerificationResend,
            $"verify-resend:{NormalizeSegment(normalizedEmail, nameof(normalizedEmail))}:{FormatUtc(window)}",
            window);
    }


    public static EmailIntentDedupeKey PasswordReset(string normalizedEmailHmac, DateTime cooldownWindowUtc)
    {
        var hmac = NormalizeHexHash(normalizedEmailHmac, nameof(normalizedEmailHmac));
        var window = RequireUtc(cooldownWindowUtc, nameof(cooldownWindowUtc));
        return new EmailIntentDedupeKey(
            EmailIntentDedupeFamily.PasswordReset,
            $"password-reset:{hmac}:{FormatUtc(window)}",
            window);
    }

    public static EmailIntentDedupeKey DeviceVerification(
        Guid userId,
        string deviceId,
        DateTime cooldownWindowUtc)
    {
        EnsureGuid(userId, nameof(userId));
        var window = RequireUtc(cooldownWindowUtc, nameof(cooldownWindowUtc));
        return new EmailIntentDedupeKey(
            EmailIntentDedupeFamily.DeviceVerification,
            $"device-verify:{userId:N}:{NormalizeSegment(deviceId, nameof(deviceId))}:{FormatUtc(window)}",
            window);
    }

    public static EmailIntentDedupeKey CashoutAccountAction(
        Guid merchantId,
        string accountOrOperationId,
        string action,
        DateTime cooldownWindowUtc)
    {
        EnsureGuid(merchantId, nameof(merchantId));
        var window = RequireUtc(cooldownWindowUtc, nameof(cooldownWindowUtc));
        return new EmailIntentDedupeKey(
            EmailIntentDedupeFamily.CashoutAccountAction,
            $"cashout-account-action:{merchantId:N}:{NormalizeSegment(accountOrOperationId, nameof(accountOrOperationId))}:{NormalizeSegment(action, nameof(action)).ToLowerInvariant()}:{FormatUtc(window)}",
            window);
    }

    public static EmailIntentDedupeKey ApiCredentialCode(
        Guid merchantId,
        string credentialOrOperationId,
        string action,
        DateTime cooldownWindowUtc)
    {
        EnsureGuid(merchantId, nameof(merchantId));
        var window = RequireUtc(cooldownWindowUtc, nameof(cooldownWindowUtc));
        return new EmailIntentDedupeKey(
            EmailIntentDedupeFamily.ApiCredentialCode,
            $"api-credential-code:{merchantId:N}:{NormalizeSegment(credentialOrOperationId, nameof(credentialOrOperationId))}:{NormalizeSegment(action, nameof(action)).ToLowerInvariant()}:{FormatUtc(window)}",
            window);
    }

    public static EmailIntentDedupeKey MerchantDeletion(Guid merchantId, DateTime cooldownWindowUtc)
    {
        EnsureGuid(merchantId, nameof(merchantId));
        var window = RequireUtc(cooldownWindowUtc, nameof(cooldownWindowUtc));
        return new EmailIntentDedupeKey(
            EmailIntentDedupeFamily.MerchantDeletion,
            $"merchant-delete:{merchantId:N}:{FormatUtc(window)}",
            window);
    }

    public static EmailIntentDedupeKey PasswordChange(Guid userId, DateTime cooldownWindowUtc)
    {
        EnsureGuid(userId, nameof(userId));
        var window = RequireUtc(cooldownWindowUtc, nameof(cooldownWindowUtc));
        return new EmailIntentDedupeKey(
            EmailIntentDedupeFamily.PasswordChange,
            $"password-change:{userId:N}:{FormatUtc(window)}",
            window);
    }

    public static EmailIntentDedupeKey ReferralPixKeyChange(Guid userId, DateTime cooldownWindowUtc)
    {
        EnsureGuid(userId, nameof(userId));
        var window = RequireUtc(cooldownWindowUtc, nameof(cooldownWindowUtc));
        return new EmailIntentDedupeKey(
            EmailIntentDedupeFamily.ReferralPixKeyChange,
            $"referral-pix-key:{userId:N}:{FormatUtc(window)}",
            window);
    }

    private static void EnsureGuid(Guid value, string parameterName)
    {
        if (value == Guid.Empty)
            throw new ArgumentException("A persisted identifier is required.", parameterName);
    }

    private static string NormalizeSegment(string value, string parameterName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("A non-empty persisted value is required.", parameterName);

        var normalized = value.Trim();
        if (normalized.Length > MaxSegmentLength || normalized.Contains(':', StringComparison.Ordinal))
            throw new ArgumentException("The value is not a valid dedupe segment.", parameterName);

        return normalized;
    }

    private static string NormalizeHexHash(string value, string parameterName)
    {
        var normalized = NormalizeSegment(value, parameterName).ToLowerInvariant();
        if (normalized.Length != 64 || normalized.Any(character => !Uri.IsHexDigit(character)))
            throw new ArgumentException("A 64-character hexadecimal HMAC is required.", parameterName);

        return normalized;
    }

    private static DateTime RequireUtc(DateTime value, string parameterName)
    {
        if (value.Kind != DateTimeKind.Utc)
            throw new ArgumentException("The timestamp must use UTC.", parameterName);

        return value;
    }

    private static string FormatUtc(DateTime value, string? parameterName = null)
    {
        var utc = RequireUtc(value, parameterName ?? nameof(value));
        return utc.ToString("yyyy-MM-dd'T'HH:mm:ss.fffffff'Z'", CultureInfo.InvariantCulture);
    }
}

public sealed class EmailIntentValidationException(string message) : ArgumentException(message);

public sealed class EmailIntentConflictException(Guid intentId)
    : InvalidOperationException($"Email intent {intentId:N} already exists with different immutable input.")
{
    public Guid IntentId { get; } = intentId;
}
