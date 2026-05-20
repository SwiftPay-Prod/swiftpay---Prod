namespace safefy_api_core.Models.Settings;

public class SmtpSettingsOptions
{
    public const string SmtpSettings = "SmtpSettings";

    public required string Host { get; set; }
    public int Port { get; set; } = 587;
    public required string Username { get; set; }
    public required string Password { get; set; }
    public required string FromEmail { get; set; }
    public required string FromName { get; set; }
    public bool EnableSsl { get; set; } = true;
    public bool EnableSend { get; set; } = true;
}
