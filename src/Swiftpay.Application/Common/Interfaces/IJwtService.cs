using Swiftpay.Domain.Entities;

namespace Swiftpay.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    bool ValidateRefreshToken(string refreshToken);
}
