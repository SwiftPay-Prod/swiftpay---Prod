using MediatR;
using Swiftpay.Application.Common;
using Swiftpay.Application.Common.Interfaces;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.Auth.DTOs;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.Enums;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Application.Features.Auth.Commands;

public record RegisterCommand(
    string Name,
    string Email,
    string Password,
    string CompanyName,
    string Document) : IRequest<Result<AuthResponse>>;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<AuthResponse>>
{
    private readonly IUserRepository _userRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;

    public RegisterCommandHandler(
        IUserRepository userRepository,
        ICompanyRepository companyRepository,
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        IJwtService jwtService)
    {
        _userRepository = userRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
    }

    public async Task<Result<AuthResponse>> Handle(RegisterCommand request, CancellationToken ct)
    {
        var existingUser = await _userRepository.GetByEmailAsync(request.Email, ct);
        if (existingUser is not null)
            return Result<AuthResponse>.Failure(Error.Conflict("Email is already registered"));

        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = request.CompanyName,
            Document = request.Document,
            KycStatus = KycStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Email = Email.Create(request.Email),
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = UserRole.Owner,
            CompanyId = company.Id,
            CreatedAt = DateTime.UtcNow
        };

        await _companyRepository.AddAsync(company, ct);
        await _userRepository.AddAsync(user, ct);
        await _unitOfWork.SaveChangesAsync(ct);

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
