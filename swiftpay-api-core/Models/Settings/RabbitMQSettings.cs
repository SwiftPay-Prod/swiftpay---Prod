namespace swiftpay_api_core.Models.Settings;

public class RabbitMQSettings
{
    public const string RabbitMQ = "RabbitMQSettings";
    
    public string HostName { get; set; } = "localhost";
    public int Port { get; set; } = 5672;
    public string UserName { get; set; } = "guest";
    public string Password { get; set; } = "guest";
    public string VirtualHost { get; set; } = "/";
    public bool Enabled { get; set; } = true;
}
