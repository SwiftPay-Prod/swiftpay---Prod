namespace swiftpay_api_core.Interfaces;

public interface IGeoLocationService
{
    Task<GeoLocationResult> GetLocationAsync(string ipAddress);
}

public record GeoLocationResult
{
    public string City { get; init; } = "Unknown";
    public string Region { get; init; } = "Unknown";
    public string Country { get; init; } = "Unknown";
    public string DisplayLocation => $"{City}, {Region}, {Country}";
}
