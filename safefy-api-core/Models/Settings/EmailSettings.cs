namespace safefy_api_core.Models.Settings;

public class EmailSettingsOptions
{
    public const string EmailSettings = "EmailSettings";

    public EmailProvider Provider { get; set; } = EmailProvider.Smtp;
    public required string FromEmail { get; set; }
    public required string FromName { get; set; }
    public bool EnableSend { get; set; } = true;

    // SMTP Configuration
    public SmtpConfiguration? Smtp { get; set; }

    // Resend Configuration
    public ResendConfiguration? Resend { get; set; }
}

public enum EmailProvider
{
    Smtp,
    Resend
}

public class SmtpConfiguration
{
    public required string Host { get; set; }
    public int Port { get; set; } = 587;
    public required string Username { get; set; }
    public required string Password { get; set; }
    public bool EnableSsl { get; set; } = true;
}

public class ResendConfiguration
{
    public required string ApiKey { get; set; }
}