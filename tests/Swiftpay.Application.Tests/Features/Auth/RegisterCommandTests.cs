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

namespace Swiftpay.Application.Tests.Features.Auth;

public class RegisterCommandTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<ICompanyRepository> _companyRepositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<IJwtService> _jwtServiceMock;
    private readonly IRequestHandler<RegisterCommand, Result<AuthResponse>> _handler;

    public RegisterCommandTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _companyRepositoryMock = new Mock<ICompanyRepository>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _jwtServiceMock = new Mock<IJwtService>();
        _handler = new RegisterCommandHandler(
            _userRepositoryMock.Object,
            _companyRepositoryMock.Object,
            _unitOfWorkMock.Object,
            _passwordHasherMock.Object,
            _jwtServiceMock.Object);
    }

    [Fact]
    public async Task Handle_ValidRegistration_ReturnsSuccessWithTokens()
    {
        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync("john@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        _passwordHasherMock
            .Setup(p => p.Hash("Str0ng!Pass"))
            .Returns("hashed_password");

        _jwtServiceMock
            .Setup(j => j.GenerateAccessToken(It.IsAny<User>()))
            .Returns("access_token_value");

        _jwtServiceMock
            .Setup(j => j.GenerateRefreshToken())
            .Returns("refresh_token_value");

        var command = new RegisterCommand(
            "John Doe",
            "john@example.com",
            "Str0ng!Pass",
            "Acme Corp",
            "12.345.678/0001-90");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.AccessToken.Should().Be("access_token_value");
        result.Value.RefreshToken.Should().Be("refresh_token_value");
        result.Value.Name.Should().Be("John Doe");
        result.Value.Email.Should().Be("john@example.com");
        result.Value.Role.Should().Be(UserRole.Owner.ToString());

        _companyRepositoryMock.Verify(r => r.AddAsync(It.Is<Company>(c =>
            c.Name == "Acme Corp" &&
            c.Document == "12.345.678/0001-90" &&
            c.KycStatus == KycStatus.Pending), It.IsAny<CancellationToken>()), Times.Once);

        _userRepositoryMock.Verify(r => r.AddAsync(It.Is<User>(u =>
            u.Name == "John Doe" &&
            u.Email.ToString() == "john@example.com" &&
            u.PasswordHash == "hashed_password" &&
            u.Role == UserRole.Owner), It.IsAny<CancellationToken>()), Times.Once);

        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_DuplicateEmail_ReturnsConflict()
    {
        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Name = "Existing User",
            Email = Domain.ValueObjects.Email.Create("john@example.com"),
            PasswordHash = "hash",
            Role = UserRole.Owner,
            CompanyId = Guid.NewGuid()
        };

        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync("john@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        var command = new RegisterCommand(
            "John Doe",
            "john@example.com",
            "Str0ng!Pass",
            "Acme Corp",
            "12.345.678/0001-90");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().NotBeNull();
        result.Error!.Code.Should().Be("CONFLICT");

        _companyRepositoryMock.Verify(r => r.AddAsync(It.IsAny<Company>(), It.IsAny<CancellationToken>()), Times.Never);
        _userRepositoryMock.Verify(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
