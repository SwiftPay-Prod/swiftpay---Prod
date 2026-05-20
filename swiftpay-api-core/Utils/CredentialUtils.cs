using safefy_api_core.Models.Acquirer;
using safefy_api_core.Models.Database;

namespace safefy_api_core.Utils;

public static class AcquirerCredentialUtils
{
    public static bool HasDefaultCredentials(Acquirer acquirer, bool isSandbox)
    {
        var credentialsJson = isSandbox 
            ? acquirer.DefaultCredentialsSandbox 
            : acquirer.DefaultCredentials;
        
        var credentials = CredentialUtils.ParseCredentials(credentialsJson);
        return credentials.Count > 0 && credentials.Values.Any(v => !string.IsNullOrEmpty(v));
    }

    public static bool HasAnyCredentials(Acquirer acquirer, bool isSandbox)
    {
        return HasDefaultCredentials(acquirer, isSandbox);
    }

    public static bool HasSandboxUrl(Acquirer acquirer)
    {
        return !string.IsNullOrEmpty(acquirer.ApiBaseUrlSandbox);
    }

    public static bool HasProductionUrl(Acquirer acquirer)
    {
        return !string.IsNullOrEmpty(acquirer.ApiBaseUrlProduction) 
               || !string.IsNullOrEmpty(acquirer.ApiBaseUrl);
    }

    public static Dictionary<string, string> GetDefaultCredentials(Acquirer acquirer, bool isSandbox)
    {
        var credentialsJson = isSandbox 
            ? acquirer.DefaultCredentialsSandbox 
            : acquirer.DefaultCredentials;
        
        return CredentialUtils.ParseCredentials(credentialsJson);
    }

    public static Dictionary<string, string> GetCredentials(
        Acquirer acquirer, 
        MerchantAcquirer merchantAcquirer, 
        bool isSandbox)
    {
        var defaultCredentials = GetDefaultCredentials(acquirer, isSandbox);
        var merchantCredentials = CredentialUtils.ParseCredentials(merchantAcquirer.Credentials);
        
        var result = new Dictionary<string, string>(defaultCredentials);
        
        foreach (var kvp in merchantCredentials)
        {
            if (!string.IsNullOrEmpty(kvp.Value))
            {
                result[kvp.Key] = kvp.Value;
            }
        }
        
        return result;
    }

    public static string? GetCredential(Dictionary<string, string> credentials, string key)
    {
        return credentials.TryGetValue(key, out var value) ? value : null;
    }

    public static string GetApiBaseUrl(Acquirer acquirer, bool isSandbox)
    {
        if (isSandbox)
        {
            return acquirer.ApiBaseUrlSandbox 
                   ?? acquirer.ApiBaseUrlProduction 
                   ?? acquirer.ApiBaseUrl 
                   ?? "";
        }
        return acquirer.ApiBaseUrlProduction 
               ?? acquirer.ApiBaseUrl 
               ?? "";
    }

    public static bool HasAnyCredentials(Dictionary<string, string>? credentials)
    {
        return credentials != null && credentials.Count > 0 &&
               credentials.Values.Any(v => !string.IsNullOrEmpty(v));
    }
}
