using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using swiftpay_api_core.Models.Settings;

namespace swiftpay_api_core.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services,
        IConfiguration configuration,
        Action<JwtBearerEvents>? configureEvents = null)
    {
        var jwtSettings = configuration.GetSection(JWTSettingsOptions.JWTSettings).Get<JWTSettingsOptions>()
            ?? throw new InvalidOperationException("JWTSettings configuration is required");

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = false,
                ValidIssuer = jwtSettings.Issuer,
                ValidAudience = jwtSettings.Audience,
                ClockSkew = TimeSpan.Zero,
                SignatureValidator = (token, _) =>
                {
                    var parts = token.Split('.');
                    if (parts.Length != 3)
                    {
                        throw new SecurityTokenMalformedException("JWT deve conter 3 partes separadas por ponto.");
                    }

                    var dataToSign = Encoding.UTF8.GetBytes($"{parts[0]}.{parts[1]}");
                    var secretBytes = Encoding.UTF8.GetBytes(jwtSettings.Secret);
                    using var hmac = new HMACSHA512(secretBytes);
                    var computedSignature = Base64UrlEncoder.Encode(hmac.ComputeHash(dataToSign));

                    if (!CryptographicOperations.FixedTimeEquals(
                        Encoding.UTF8.GetBytes(computedSignature),
                        Encoding.UTF8.GetBytes(parts[2])))
                    {
                        throw new SecurityTokenInvalidSignatureException("Assinatura do JWT inválida.");
                    }

                    return new JwtSecurityToken(token);
                }
            };

            if (configureEvents != null)
            {
                options.Events = new JwtBearerEvents();
                configureEvents(options.Events);
            }
        });

        return services;
    }
}
