using System.IdentityModel.Tokens.Jwt;
using safefy_api.Models.Auth;

namespace safefy_api.Interfaces;

public interface ITokenService
{
    JWTGenerated GenerateToken(string sessionId, Guid userId);

    [Obsolete("Use GenerateToken(string sessionId, Guid userId) instead. This method will be removed in a future version.")]
    JWTGenerated GenerateToken(UserSubject userSubject);

    JWTDecode VerifyToken(string token);
    JwtSecurityToken DecodeToken(string bearerToken);
}
