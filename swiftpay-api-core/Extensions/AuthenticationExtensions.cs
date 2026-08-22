using System.IdentityModel.Tokens.Jwt;
using JWT.Algorithms;
using JWT.Builder;
using JWT.Exceptions;
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
                    try
                    {
                        JwtBuilder.Create()
                            .WithAlgorithm(new HMACSHA512Algorithm())
                            .WithSecret(jwtSettings.Secret)
                            .MustVerifySignature()
                            .Decode<Dictionary<string, object>>(token);

                        return new JwtSecurityToken(token);
                    }
                    catch (SignatureVerificationException ex)
                    {
                        throw new SecurityTokenInvalidSignatureException("Assinatura do JWT inválida.", ex);
                    }
                    catch (TokenExpiredException ex)
                    {
                        throw new SecurityTokenExpiredException("Token expirado.", ex);
                    }
                    catch (Exception ex)
                    {
                        throw new SecurityTokenException("Falha na validação do token.", ex);
                    }
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
