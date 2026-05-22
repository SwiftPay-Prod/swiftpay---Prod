using FluentAssertions;
using MediatR;
using Moq;
using Swiftpay.Application.Common;
using Swiftpay.Application.Common.Interfaces;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.Auth.Commands;
using Swiftpay.Application.Features.Auth.DTOs;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.Enums;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Application.Tests.Features.Auth;

public class LoginCommandTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<IJwtService> _jwtServiceMock;
    private readonly IRequestHandler<LoginCommand, Result<AuthResponse>> _handler;

    public LoginCommandTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _jwtServiceMock = new Mock<IJwtService>();
        _handler = new LoginCommandHandler(
            _userRepositoryMock.Object,
            _passwordHasherMock.Object,
            _jwtServiceMock.Object);
    }

    [Fact]
    public async Task Handle_ValidCredentials_ReturnsSuccessWithTokens()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = "John Doe",
            Email = Email.Create("john@example.com"),
            PasswordHash = "hashed_password",
            Role = UserRole.Owner,
            CompanyId = Guid.NewGuid()
        };

        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync("john@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _passwordHasherMock
            .Setup(p => p.Verify("correct_password", user.PasswordHash))
            .Returns(true);

        _jwtServiceMock
            .Setup(j => j.GenerateAccessToken(user))
            .Returns("access_token_value");

        _jwtServiceMock
            .Setup(j => j.GenerateRefreshToken())
            .Returns("refresh_token_value");

        var command = new LoginCommand("john@example.com", "correct_password");
        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.AccessToken.Should().Be("access_token_value");
        result.Value.RefreshToken.Should().Be("refresh_token_value");
        result.Value.UserId.Should().Be(user.Id);
        result.Value.Name.Should().Be(user.Name);
        result.Value.Email.Should().Be(user.Email.ToString());
        result.Value.Role.Should().Be(user.Role.ToString());
        result.Value.CompanyId.Should().Be(user.CompanyId);
    }

    [Fact]
    public async Task Handle_InvalidEmail_ReturnsUnauthorized()
    {
        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync("unknown@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var command = new LoginCommand("unknown@example.com", "any_password");
        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().NotBeNull();
        result.Error!.Code.Should().Be("UNAUTHORIZED");
    }

    [Fact]
    public async Task Handle_WrongPassword_ReturnsUnauthorized()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = "John Doe",
            Email = Email.Create("john@example.com"),
            PasswordHash = "hashed_password",
            Role = UserRole.Owner,
            CompanyId = Guid.NewGuid()
        };

        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync("john@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _passwordHasherMock
            .Setup(p => p.Verify("wrong_password", user.PasswordHash))
            .Returns(false);

        var command = new LoginCommand("john@example.com", "wrong_password");
        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().NotBeNull();
        result.Error!.Code.Should().Be("UNAUTHORIZED");
    }
}
