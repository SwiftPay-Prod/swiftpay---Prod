namespace swiftpay_api_core.Utils;

public static class DateTimeUtils
{
    private static readonly TimeZoneInfo? BrasiliaTimeZoneLinux;
    private static readonly TimeZoneInfo? BrasiliaTimeZoneWindows;

    static DateTimeUtils()
    {
        try
        {
            BrasiliaTimeZoneLinux = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
        }
        catch
        {
            BrasiliaTimeZoneLinux = null;
        }

        try
        {
            BrasiliaTimeZoneWindows = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
        }
        catch
        {
            BrasiliaTimeZoneWindows = null;
        }
    }

    public static TimeZoneInfo BrasiliaTimeZone => ResolvedBrazilTimeZone;

    private static TimeZoneInfo ResolvedBrazilTimeZone =>
        BrasiliaTimeZoneLinux ?? BrasiliaTimeZoneWindows
        ?? throw new InvalidOperationException("Brazil timezone is not available on this system.");

    /// <summary>
    /// Retorna o horário atual no fuso de Brasília
    /// </summary>
    public static DateTime GetBrasiliaTime() =>
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, ResolvedBrazilTimeZone);

    /// <summary>
    /// Converte um DateTime UTC para o fuso de Brasília
    /// </summary>
    public static DateTime ToBrasiliaTime(DateTime utcDateTime) =>
        TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, ResolvedBrazilTimeZone);

    /// <summary>
    /// Retorna o início do dia atual no fuso de Brasília, convertido para UTC.
    /// Use para filtros no banco: WHERE CreatedAt >= GetTodayStartUtc()
    /// </summary>
    public static DateTime GetTodayStartUtc()
    {
        var brasiliaToday = GetBrasiliaTime().Date;
        return TimeZoneInfo.ConvertTimeToUtc(brasiliaToday, ResolvedBrazilTimeZone);
    }

    /// <summary>
    /// Retorna o fim do dia atual no fuso de Brasília (23:59:59.999), convertido para UTC.
    /// </summary>
    public static DateTime GetTodayEndUtc()
    {
        var brasiliaToday = GetBrasiliaTime().Date.AddDays(1).AddTicks(-1);
        return TimeZoneInfo.ConvertTimeToUtc(brasiliaToday, ResolvedBrazilTimeZone);
    }

    /// <summary>
    /// Retorna o início da semana (domingo) no fuso de Brasília, convertido para UTC.
    /// </summary>
    public static DateTime GetWeekStartUtc()
    {
        var brasiliaToday = GetBrasiliaTime().Date;
        var startOfWeek = brasiliaToday.AddDays(-(int)brasiliaToday.DayOfWeek);
        return TimeZoneInfo.ConvertTimeToUtc(startOfWeek, ResolvedBrazilTimeZone);
    }

    /// <summary>
    /// Retorna o início do mês atual no fuso de Brasília, convertido para UTC.
    /// </summary>
    public static DateTime GetMonthStartUtc()
    {
        var brasiliaToday = GetBrasiliaTime().Date;
        var startOfMonth = new DateTime(brasiliaToday.Year, brasiliaToday.Month, 1);
        return TimeZoneInfo.ConvertTimeToUtc(startOfMonth, ResolvedBrazilTimeZone);
    }

    /// <summary>
    /// Retorna a data de hoje no fuso de Brasília como DateTime (para comparações .Date).
    /// Use quando precisar comparar com .Date de registros no banco.
    /// </summary>
    public static DateTime GetBrasiliaTodayDateTime() => GetBrasiliaTime().Date;

    /// <summary>
    /// Retorna a data de hoje no fuso de Brasília como DateOnly (para comparações de data).
    /// Use para gráficos e agrupamentos por dia.
    /// </summary>
    public static DateOnly GetBrasiliaTodayDate() => DateOnly.FromDateTime(GetBrasiliaTime());

    /// <summary>
    /// Retorna N dias atrás no fuso de Brasília, como DateTime UTC (início do dia).
    /// </summary>
    public static DateTime GetDaysAgoUtc(int days)
    {
        var brasiliaDate = GetBrasiliaTime().Date.AddDays(-days);
        return TimeZoneInfo.ConvertTimeToUtc(brasiliaDate, ResolvedBrazilTimeZone);
    }

    /// <summary>
    /// Converte um DateTime UTC para DateOnly no fuso de Brasília.
    /// Útil para agrupar dados por dia.
    /// </summary>
    public static DateOnly ToDateOnlyBrasilia(DateTime utcDateTime) =>
        DateOnly.FromDateTime(ToBrasiliaTime(utcDateTime));
}
