namespace safefy_api_core.Models.Settings;

/// <summary>
/// Configurações do banco de dados de logs.
/// </summary>
public class LogsDatabaseSettingsOptions
{
    public const string LogsDatabaseSettings = "LogsDatabaseSettings";

    /// <summary>
    /// String de conexão com o banco de dados de logs.
    /// </summary>
    public string ConnectionString { get; set; } = string.Empty;
}
