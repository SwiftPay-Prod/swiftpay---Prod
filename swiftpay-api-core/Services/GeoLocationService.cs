using System.Text.Json;
using System.Net.Sockets;
using Microsoft.Extensions.Logging;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api_core.Services;

public class GeoLocationService(
    IHttpClientFactory httpClientFactory,
    ILogger<GeoLocationService> logger
) : IGeoLocationService
{
    public async Task<GeoLocationResult> GetLocationAsync(string ipAddress)
    {
        try
        {
            var clientIp = ipAddress.Contains(',') 
                ? ipAddress.Split(',')[0].Trim() 
                : ipAddress.Trim();
            
            if (IsPrivateOrLocalIp(clientIp))
            {
                return new GeoLocationResult
                {
                    City = "Local",
                    Region = "Local",
                    Country = "Local"
                };
            }

            var client = httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(3);

            // Using ip-api.com free API (no key required, 45 requests per minute)
            var response = await client.GetAsync($"http://ip-api.com/json/{clientIp}?fields=city,regionName,country,status");
            
            if (!response.IsSuccessStatusCode)
            {
                return new GeoLocationResult();
            }

            var content = await response.Content.ReadAsStringAsync();
            var json = JsonDocument.Parse(content);
            var root = json.RootElement;

            if (root.TryGetProperty("status", out var status) && status.GetString() != "success")
            {
                return new GeoLocationResult();
            }

            return new GeoLocationResult
            {
                City = root.TryGetProperty("city", out var city) ? city.GetString() ?? "Desconhecida" : "Desconhecida",
                Region = root.TryGetProperty("regionName", out var region) ? region.GetString() ?? "Desconhecido" : "Desconhecido",
                Country = root.TryGetProperty("country", out var country) ? country.GetString() ?? "Desconhecido" : "Desconhecido"
            };
        }
        catch (Exception ex)
        {
            if (IsConnectivityFailure(ex))
            {
                return new GeoLocationResult();
            }

            logger.LogError(ex, "Failed to get geolocation for IP {IpAddress}", ipAddress);
            return new GeoLocationResult();
        }
    }

    private static bool IsConnectivityFailure(Exception exception)
    {
        if (exception is TaskCanceledException or OperationCanceledException)
            return true;

        if (exception is HttpRequestException httpRequestException)
        {
            if (httpRequestException.InnerException is SocketException)
                return true;

            return true;
        }

        return false;
    }

    private static bool IsPrivateOrLocalIp(string ipAddress)
    {
        if (string.IsNullOrEmpty(ipAddress) || ipAddress == "unknown")
            return true;

        // Normalize IPv6-mapped IPv4 addresses (::ffff:192.168.1.1 -> 192.168.1.1)
        var normalizedIp = ipAddress;
        if (ipAddress.StartsWith("::ffff:", StringComparison.OrdinalIgnoreCase))
        {
            normalizedIp = ipAddress[7..]; // Remove "::ffff:" prefix
        }

        if (normalizedIp == "::1" || normalizedIp == "127.0.0.1" || normalizedIp.StartsWith("localhost"))
            return true;

        // Check for private IP ranges (RFC 1918)
        if (normalizedIp.StartsWith("192.168.") || 
            normalizedIp.StartsWith("10.") || 
            normalizedIp.StartsWith("172.16.") ||
            normalizedIp.StartsWith("172.17.") ||
            normalizedIp.StartsWith("172.18.") ||
            normalizedIp.StartsWith("172.19.") ||
            normalizedIp.StartsWith("172.20.") ||
            normalizedIp.StartsWith("172.21.") ||
            normalizedIp.StartsWith("172.22.") ||
            normalizedIp.StartsWith("172.23.") ||
            normalizedIp.StartsWith("172.24.") ||
            normalizedIp.StartsWith("172.25.") ||
            normalizedIp.StartsWith("172.26.") ||
            normalizedIp.StartsWith("172.27.") ||
            normalizedIp.StartsWith("172.28.") ||
            normalizedIp.StartsWith("172.29.") ||
            normalizedIp.StartsWith("172.30.") ||
            normalizedIp.StartsWith("172.31."))
            return true;

        return false;
    }
}
