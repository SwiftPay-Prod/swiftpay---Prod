using Microsoft.AspNetCore.Identity;
using Swiftpay.Application.Common.Interfaces;

namespace Swiftpay.Infrastructure.Services;

public class PasswordHasher : IPasswordHasher
{
    private readonly PasswordHasher<object> _hasher = new();

    public string Hash(string password)
    {
        return _hasher.HashPassword(null!, password);
    }

    public bool Verify(string password, string hash)
    {
        var result = _hasher.VerifyHashedPassword(null!, hash, password);
        return result == PasswordVerificationResult.Success;
    }
}
