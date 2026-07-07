using System.ComponentModel;
using FastEndpoints;
using FluentValidation;
using swiftpay_api_payment.Endpoints.Models;

namespace swiftpay_api_payment.Endpoints.Auth.Token;

public class TokenRequest
{
    [DefaultValue("client_credentials")]
    public string GrantType { get; set; } = "client_credentials";
    
    public string PublicKey { get; set; } = null!;
    
    public string SecretKey { get; set; } = null!;
}

public class TokenRequestValidator : Validator<TokenRequest>
{
    public TokenRequestValidator()
    {
        RuleFor(x => x.GrantType)
            .NotEmpty().WithMessage("O tipo de grant é obrigatório.")
            .Must(x => x == "client_credentials").WithMessage("Grant type deve ser 'client_credentials'.");

        RuleFor(x => x.PublicKey)
            .NotEmpty().WithMessage("O Public Key é obrigatório.");

        RuleFor(x => x.SecretKey)
            .NotEmpty().WithMessage("O Secret Key é obrigatório.");
    }
}

public class TokenResponse : BaseResponse<TokenData> { }

public class TokenData
{
    public string AccessToken { get; set; } = null!;
    
    public string TokenType { get; set; } = "Bearer";
    
    public int ExpiresIn { get; set; }
    
    public string Environment { get; set; } = null!;
}
