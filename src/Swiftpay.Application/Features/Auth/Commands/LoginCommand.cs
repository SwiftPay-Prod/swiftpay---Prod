using MediatR;
using Swiftpay.Application.Common;
using Swiftpay.Application.Common.Interfaces;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.Auth.DTOs;

namespace Swiftpay.Application.Features.Auth.Commands;

public record LoginCommand(string Email, string Password) : IRequest<Result<AuthResponse>>;

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthResponse>>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;

    public LoginCommandHandler(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IJwtService jwtService)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
    }

    public async Task<Result<AuthResponse>> Handle(LoginCommand request, CancellationToken ct)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email, ct);
        if (user is null)
            return Result<AuthResponse>.Failure(Error.Unauthorized("Invalid email or password"));

        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
            return Result<AuthResponse>.Failure(Error.Unauthorized("Invalid email or password"));

        return new AuthResponse
        {
            AccessToken = _jwtService.GenerateAccessToken(user),
            RefreshToken = _jwtService.GenerateRefreshToken(),
            UserId = user.Id,
            Name = user.Name,
            Email = user.Email.ToString(),
            Role = user.Role.ToString(),
            CompanyId = user.CompanyId
        };
    }
}
