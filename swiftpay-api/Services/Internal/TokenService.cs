using System.IdentityModel.Tokens.Jwt;
using Microsoft.Extensions.Options;
using swiftpay_api.Interfaces;
using swiftpay_api.Models.Auth;
using swiftpay_api_core.Models.Settings;
using JWT.Builder;
using JWT.Algorithms;

namespace swiftpay_api.Services.Internal;

public class TokenService(IOptions<JWTSettingsOptions> jwtSettingsOptions) : ITokenService
{
    private readonly JWTSettingsOptions _jwtSettings = jwtSettingsOptions.Value;

    /// <summary>
    /// Generates a minimal JWT containing the session ID and user ID.
    /// All other user data (role, email, etc.) is stored in Redis and validated on each request.
    /// The user ID is included for SignalR user identification.
    /// </summary>
    public JWTGenerated GenerateToken(string sessionId, Guid userId)
    {
        var expiresAt = DateTime.UtcNow.AddDays(_jwtSettings.TokenExpiryDays);

        var jwt = JwtBuilder.Create()
                    .WithAlgorithm(new HMACSHA512Algorithm())
                    .WithSecret(_jwtSettings.Secret)
                    .AddClaim(ClaimName.Issuer, _jwtSettings.Issuer)
                    .AddClaim(ClaimName.Audience, _jwtSettings.Audience)
                    .AddClaim(ClaimName.Subject, userId.ToString())
                    .AddClaim("sid", sessionId)
                    .ExpirationTime(expiresAt)
                    .Encode();

        return new JWTGenerated()
        {
            AccessToken = jwt,
            SessionId = sessionId,
            ExpiredAt = expiresAt,
            CreatedOn = DateTime.UtcNow
        };
    }

    [Obsolete("Use GenerateToken(string sessionId) instead. This method will be removed in a future version.")]
    public JWTGenerated GenerateToken(UserSubject userSubject)
    {
        var expiresAt = DateTime.UtcNow.AddDays(_jwtSettings.TokenExpiryDays);

        var jwt = JwtBuilder.Create()
                    .WithAlgorithm(new HMACSHA512Algorithm())
                    .WithSecret(_jwtSettings.Secret)
                    .AddClaim(ClaimName.Issuer, _jwtSettings.Issuer)
                    .AddClaim(ClaimName.Audience, _jwtSettings.Audience)
                    .AddClaim("roles", userSubject.Role)
                    .AddClaim(ClaimName.Subject, userSubject.Id)
                    .AddClaim(ClaimName.GivenName, userSubject.Name)
                    .AddClaim(ClaimName.PreferredEmail, userSubject.Email)
                    .AddClaim("device_id", userSubject.DeviceId)
                    .ExpirationTime(expiresAt)
                    .Encode();

        return new JWTGenerated()
        {
            AccessToken = jwt,
            ExpiredAt = expiresAt,
            CreatedOn = DateTime.UtcNow
        };
    }

    public JWTDecode VerifyToken(string token)
    {
        var jwt = JwtBuilder.Create()
                     .WithAlgorithm(new HMACSHA512Algorithm())
                     .WithSecret(_jwtSettings.Secret)
                     .Decode<JWTDecode>(token);

        return jwt;
    }

    public JwtSecurityToken DecodeToken(string bearerToken)
    {
        var jwtDecode = new JwtSecurityToken(bearerToken.Replace("Bearer ", ""));
        return jwtDecode;
    }
}
