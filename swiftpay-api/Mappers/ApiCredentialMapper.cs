using safefy_api.Endpoints.Merchants.Credentials.CreateApiCredential;
using safefy_api.Endpoints.Merchants.Credentials.ReadListApiCredentials;
using safefy_api_core.Models.Database;

namespace safefy_api.Mappers;

public static class ApiCredentialMapper
{
    public static ApiCredentialData ToCreateData(MerchantApiCredential credential, string clientSecret) => new()
    {
        Id = credential.Id,
        Name = credential.Name,
        ClientId = credential.ClientId,
        ClientSecret = clientSecret,
        Environment = credential.Environment,
        AllowedIpRange = credential.AllowedIpRange,
        CreatedAt = credential.CreatedAt
    };

    public static ApiCredentialListData ToListData(MerchantApiCredential credential) => new()
    {
        Id = credential.Id,
        Name = credential.Name,
        ClientId = credential.ClientId,
        Environment = credential.Environment,
        Status = credential.Status,
        AllowedIpRange = credential.AllowedIpRange,
        CreatedAt = credential.CreatedAt,
        UpdatedAt = credential.UpdatedAt
    };
}
