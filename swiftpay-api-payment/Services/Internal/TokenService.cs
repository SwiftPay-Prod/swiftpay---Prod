using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using swiftpay_api_payment.Interfaces.Internal;
using swiftpay_api_core.Models.Settings;

namespace swiftpay_api_payment.Services.Internal;

public class TokenService(IOptions<JWTSettingsOptions> jwtSettings) : ITokenService
{
    private readonly JWTSettingsOptions _jwtSettings = jwtSettings.Value;

    public string GenerateAccessToken(Guid merchantId, Guid credentialId, string environment, int secretVersion)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_jwtSettings.Secret);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, merchantId.ToString()),
            new("credential_id", credentialId.ToString()),
            new("environment", environment),
            new("secret_version", secretVersion.ToString(), ClaimValueTypes.Integer32),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddSeconds(_jwtSettings.TokenExpireSeconds),
            Issuer = _jwtSettings.Issuer,
            Audience = _jwtSettings.Audience,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public TokenData? ValidateToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_jwtSettings.Secret);

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _jwtSettings.Issuer,
                ValidateAudience = true,
                ValidAudience = _jwtSettings.Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

            if (validatedToken is not JwtSecurityToken jwtToken ||
                !jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            var merchantIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var credentialIdClaim = principal.FindFirst("credential_id")?.Value;
            var environmentClaim = principal.FindFirst("environment")?.Value;
            var secretVersionClaim = principal.FindFirst("secret_version")?.Value;

            if (string.IsNullOrEmpty(merchantIdClaim) || 
                string.IsNullOrEmpty(credentialIdClaim) || 
                string.IsNullOrEmpty(environmentClaim))
            {
                return null;
            }

            return new TokenData
            {
                MerchantId = Guid.Parse(merchantIdClaim),
                CredentialId = Guid.Parse(credentialIdClaim),
                Environment = environmentClaim,
                SecretVersion = int.TryParse(secretVersionClaim, out var version) ? version : 1,
                ExpiresAt = jwtToken.ValidTo
            };
        }
        catch
        {
            return null;
        }
    }
}
