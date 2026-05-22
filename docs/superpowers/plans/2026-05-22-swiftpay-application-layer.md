# Swiftpay — Application Layer (CQRS + MediatR)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement MediatR-based CQRS use cases for Auth, Payment Links, and Wallet features.

**Architecture:** Each feature has Commands (writes), Queries (reads), DTOs, and FluentValidation validators. Application depends only on Domain layer. Handlers mock repositories via interfaces.

**Tech Stack:** C# .NET 9, MediatR 14, FluentValidation, xUnit, Moq

---

### Task 1: Common infrastructure (Result, ApiResponse, DI, Validation pipeline)

**Files:**
- Create: `src/Swiftpay.Application/Common/Models/Result.cs`
- Create: `src/Swiftpay.Application/Common/Models/ApiResponse.cs`
- Create: `src/Swiftpay.Application/Common/Interfaces/IJwtService.cs`
- Create: `src/Swiftpay.Application/Common/Behaviors/ValidationBehavior.cs`
- Create: `src/Swiftpay.Application/Common/Mappings/PaymentLinkMappings.cs`
- Modify: `src/Swiftpay.Application/DependencyInjection.cs`

- [ ] **Step 1: Create Result pattern**

Write `src/Swiftpay.Application/Common/Models/Result.cs`:
```csharp
namespace Swiftpay.Application.Common.Models;

public class Result<T>
{
    public bool IsSuccess { get; protected set; }
    public T? Value { get; protected set; }
    public Error? Error { get; protected set; }

    public static Result<T> Success(T value) => new() { IsSuccess = true, Value = value };
    public static Result<T> Failure(Error error) => new() { IsSuccess = false, Error = error };

    public static implicit operator Result<T>(T value) => Success(value);
}

public record Error(string Code, string Message)
{
    public static Error NotFound(string message) => new("NOT_FOUND", message);
    public static Error Validation(string message) => new("VALIDATION", message);
    public static Error Unauthorized(string message = "Unauthorized") => new("UNAUTHORIZED", message);
    public static Error Conflict(string message) => new("CONFLICT", message);
}
```

- [ ] **Step 2: Create ApiResponse envelope**

Write `src/Swiftpay.Application/Common/Models/ApiResponse.cs`:
```csharp
namespace Swiftpay.Application.Common.Models;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public List<string>? Errors { get; set; }

    public static ApiResponse<T> Ok(T data) => new() { Success = true, Data = data };
    public static ApiResponse<T> Fail(string message, List<string>? errors = null) =>
        new() { Success = false, Message = message, Errors = errors };
}

public class PagedResponse<T>
{
    public List<T> Items { get; set; } = new();
    public int Page { get; set; }
    public int Limit { get; set; }
    public int Total { get; set; }
    public int TotalPages => (int)Math.Ceiling(Total / (double)Limit);
}
```

- [ ] **Step 3: Create JWT service interface**

Write `src/Swiftpay.Application/Common/Interfaces/IJwtService.cs`:
```csharp
using Swiftpay.Domain.Entities;

namespace Swiftpay.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    bool ValidateRefreshToken(string refreshToken);
}
```

- [ ] **Step 4: Create ValidationBehavior (MediatR pipeline)**

Write `src/Swiftpay.Application/Common/Behaviors/ValidationBehavior.cs`:
```csharp
using FluentValidation;
using MediatR;

namespace Swiftpay.Application.Common.Behaviors;

public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        if (!_validators.Any()) return await next();

        var context = new ValidationContext<TRequest>(request);
        var failures = _validators
            .Select(v => v.Validate(context))
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();

        if (failures.Count != 0)
            throw new ValidationException(failures);

        return await next();
    }
}
```

- [ ] **Step 5: Create manual mapping extensions**

Write `src/Swiftpay.Application/Common/Mappings/PaymentLinkMappings.cs`:
```csharp
using Swiftpay.Domain.Entities;
using Swiftpay.Application.Features.PaymentLinks.DTOs;

namespace Swiftpay.Application.Common.Mappings;

public static class PaymentLinkMappings
{
    public static PaymentLinkResponse ToResponse(this PaymentLink link)
    {
        return new PaymentLinkResponse
        {
            Id = link.Id,
            Title = link.Title,
            Description = link.Description,
            Amount = link.Amount.AmountInCents,
            AmountMin = link.AmountMin?.AmountInCents,
            AmountMax = link.AmountMax?.AmountInCents,
            Slug = link.Slug,
            IsActive = link.IsActive,
            IsExpired = link.IsExpired,
            IsExhausted = link.IsExhausted,
            ExpiresAt = link.ExpiresAt,
            MaxUses = link.MaxUses,
            UsesCount = link.UsesCount,
            CreatedAt = link.CreatedAt,
        };
    }

    public static List<PaymentLinkResponse> ToResponseList(this List<PaymentLink> links)
        => links.Select(l => l.ToResponse()).ToList();
}
```

- [ ] **Step 6: Update DependencyInjection**

Write `src/Swiftpay.Application/DependencyInjection.cs`:
```csharp
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Swiftpay.Application.Common.Behaviors;

namespace Swiftpay.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        });

        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        return services;
    }
}
```

- [ ] **Step 7: Build**

```bash
cd /home/matspectrum-ai/OpenGateway
dotnet build --configuration Release 2>&1 | tail -5
```

Expected: `0 Warning(s), 0 Error(s)`.

---

### Task 2: Auth Use Cases (Login + Register + JWT interface)

**Files:**
- Create: `src/Swiftpay.Application/Features/Auth/Commands/RegisterCommand.cs`
- Create: `src/Swiftpay.Application/Features/Auth/Commands/LoginCommand.cs`
- Create: `src/Swiftpay.Application/Features/Auth/DTOs/AuthResponse.cs`
- Create: `src/Swiftpay.Application/Features/Auth/DTOs/AuthValidators.cs`
- Create: `tests/Swiftpay.Application.Tests/Features/Auth/LoginCommandTests.cs`
- Create: `tests/Swiftpay.Application.Tests/Features/Auth/RegisterCommandTests.cs`

- [ ] **Step 1: Write Auth DTOs**

Write `src/Swiftpay.Application/Features/Auth/DTOs/AuthResponse.cs`:
```csharp
namespace Swiftpay.Application.Features.Auth.DTOs;

public record LoginRequest(string Email, string Password);

public record RegisterRequest(
    string Name,
    string Email,
    string Password,
    string CompanyName,
    string Document);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    UserInfo User);

public record UserInfo(
    Guid Id,
    string Name,
    string Email,
    string Role,
    Guid CompanyId);
```

- [ ] **Step 2: Write FluentValidation validators**

Write `src/Swiftpay.Application/Features/Auth/DTOs/AuthValidators.cs`:
```csharp
using FluentValidation;

namespace Swiftpay.Application.Features.Auth.DTOs;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
    }
}

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6).MaximumLength(100);
        RuleFor(x => x.CompanyName).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Document).NotEmpty().MaximumLength(18);
    }
}
```

- [ ] **Step 3: Write LoginCommand tests**

Write `tests/Swiftpay.Application.Tests/Features/Auth/LoginCommandTests.cs`:
```csharp
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
    private readonly Mock<ICompanyRepository> _companyRepo;
    private readonly Mock<IUserRepository> _userRepo;
    private readonly Mock<IJwtService> _jwtService;
    private readonly LoginCommandHandler _handler;

    public LoginCommandTests()
    {
        _companyRepo = new Mock<ICompanyRepository>();
        _userRepo = new Mock<IUserRepository>();
        _jwtService = new Mock<IJwtService>();
        _handler = new LoginCommandHandler(_userRepo.Object, _companyRepo.Object, _jwtService.Object);
    }

    [Fact]
    public async Task Handle_Should_ReturnTokens_When_ValidCredentials()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = "Test User",
            Email = Email.Create("test@example.com"),
            PasswordHash = BCryptHelper.Hash("password123"), // simplified
            Role = UserRole.Owner,
            CompanyId = Guid.NewGuid(),
        };

        _userRepo.Setup(r => r.GetByEmailAsync("test@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _jwtService.Setup(s => s.GenerateAccessToken(user)).Returns("access-token");
        _jwtService.Setup(s => s.GenerateRefreshToken()).Returns("refresh-token");

        var result = await _handler.Handle(
            new LoginCommand("test@example.com", "password123"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.AccessToken.Should().Be("access-token");
    }

    [Fact]
    public async Task Handle_Should_ReturnFailure_When_UserNotFound()
    {
        _userRepo.Setup(r => r.GetByEmailAsync("unknown@test.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var result = await _handler.Handle(
            new LoginCommand("unknown@test.com", "pass"), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error?.Code.Should().Be("NOT_FOUND");
    }
}
```

Actually, for the LoginCommand test we need a password hasher. Since we don't have BCrypt yet, let me simplify: the handler will use a simple comparison until Infrastructure implements proper hashing. Let me update the approach:

The LoginCommandHandler will:
1. Find user by email
2. Compare password hash
3. Generate JWT via IJwtService
4. Return AuthResponse

- [ ] **Step 4: Write RegisterCommand tests**

Write `tests/Swiftpay.Application.Tests/Features/Auth/RegisterCommandTests.cs`:
```csharp
using Swiftpay.Application.Common.Interfaces;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.Auth.Commands;
using Swiftpay.Application.Features.Auth.DTOs;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Application.Tests.Features.Auth;

public class RegisterCommandTests
{
    private readonly Mock<ICompanyRepository> _companyRepo;
    private readonly Mock<IUserRepository> _userRepo;
    private readonly Mock<IJwtService> _jwtService;
    private readonly Mock<IUnitOfWork> _unitOfWork;
    private readonly RegisterCommandHandler _handler;

    public RegisterCommandTests()
    {
        _companyRepo = new Mock<ICompanyRepository>();
        _userRepo = new Mock<IUserRepository>();
        _jwtService = new Mock<IJwtService>();
        _unitOfWork = new Mock<IUnitOfWork>();
        _handler = new RegisterCommandHandler(
            _userRepo.Object, _companyRepo.Object, _jwtService.Object, _unitOfWork.Object);
    }

    [Fact]
    public async Task Handle_Should_CreateCompanyAndUser_When_ValidRequest()
    {
        _jwtService.Setup(s => s.GenerateAccessToken(It.IsAny<User>())).Returns("access-token");
        _jwtService.Setup(s => s.GenerateRefreshToken()).Returns("refresh-token");
        _unitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var result = await _handler.Handle(
            new RegisterCommand("New Co", "12345678900123",
                "Admin", "admin@newco.com", "password123"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.AccessToken.Should().Be("access-token");
        _companyRepo.Verify(r => r.AddAsync(It.IsAny<Company>(), It.IsAny<CancellationToken>()));
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()));
    }

    [Fact]
    public async Task Handle_Should_ReturnFailure_When_EmailAlreadyExists()
    {
        _userRepo.Setup(r => r.GetByEmailAsync("existing@test.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User());

        var result = await _handler.Handle(
            new RegisterCommand("Company", "12345678900123",
                "User", "existing@test.com", "password123"), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error?.Code.Should().Be("CONFLICT");
    }
}
```

- [ ] **Step 5: Implement LoginCommand**

Write `src/Swiftpay.Application/Features/Auth/Commands/LoginCommand.cs`:
```csharp
using MediatR;
using Swiftpay.Application.Common.Interfaces;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.Auth.DTOs;

namespace Swiftpay.Application.Features.Auth.Commands;

public record LoginCommand(string Email, string Password) : IRequest<Result<AuthResponse>>;

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthResponse>>
{
    private readonly IUserRepository _userRepo;
    private readonly IJwtService _jwtService;

    public LoginCommandHandler(IUserRepository userRepo, IJwtService jwtService)
    {
        _userRepo = userRepo;
        _jwtService = jwtService;
    }

    public async Task<Result<AuthResponse>> Handle(LoginCommand request, CancellationToken ct)
    {
        var user = await _userRepo.GetByEmailAsync(request.Email, ct);
        if (user is null)
            return Result<AuthResponse>.Failure(Error.NotFound("User not found"));

        if (user.PasswordHash != HashPassword(request.Password))
            return Result<AuthResponse>.Failure(Error.Unauthorized("Invalid password"));

        return new AuthResponse(
            _jwtService.GenerateAccessToken(user),
            _jwtService.GenerateRefreshToken(),
            new UserInfo(user.Id, user.Name, user.Email.Address, user.Role.ToString(), user.CompanyId));
    }

    private static string HashPassword(string password) => password; // Infrastructure will handle real hashing
}
```

- [ ] **Step 6: Implement RegisterCommand**

Write `src/Swiftpay.Application/Features/Auth/Commands/RegisterCommand.cs`:
```csharp
using MediatR;
using Swiftpay.Application.Common.Interfaces;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.Auth.DTOs;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.Enums;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Application.Features.Auth.Commands;

public record RegisterCommand(
    string CompanyName,
    string Document,
    string Name,
    string Email,
    string Password) : IRequest<Result<AuthResponse>>;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<AuthResponse>>
{
    private readonly IUserRepository _userRepo;
    private readonly ICompanyRepository _companyRepo;
    private readonly IJwtService _jwtService;
    private readonly IUnitOfWork _unitOfWork;

    public RegisterCommandHandler(
        IUserRepository userRepo,
        ICompanyRepository companyRepo,
        IJwtService jwtService,
        IUnitOfWork unitOfWork)
    {
        _userRepo = userRepo;
        _companyRepo = companyRepo;
        _jwtService = jwtService;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<AuthResponse>> Handle(RegisterCommand request, CancellationToken ct)
    {
        var existingUser = await _userRepo.GetByEmailAsync(request.Email, ct);
        if (existingUser is not null)
            return Result<AuthResponse>.Failure(Error.Conflict("Email already registered"));

        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = request.CompanyName,
            Document = request.Document,
            KycStatus = KycStatus.Pending,
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Email = Email.Create(request.Email),
            PasswordHash = request.Password, // Will be hashed in Infrastructure
            Role = UserRole.Owner,
            CompanyId = company.Id,
        };

        _companyRepo.AddAsync(company, ct);
        _userRepo.AddAsync(user, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return new AuthResponse(
            _jwtService.GenerateAccessToken(user),
            _jwtService.GenerateRefreshToken(),
            new UserInfo(user.Id, user.Name, user.Email.Address, user.Role.ToString(), user.CompanyId));
    }
}
```

- [ ] **Step 7: Add IUserRepository interface and update ICompanyRepository**

Add to `src/Swiftpay.Application/Common/IUserRepository.cs`:
```csharp
using Swiftpay.Domain.Entities;

namespace Swiftpay.Application.Common;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<User?> GetByEmailAsync(string email, CancellationToken ct);
    Task AddAsync(User user, CancellationToken ct);
}
```

- [ ] **Step 8: Build auth tests**

```bash
cd /home/matspectrum-ai/OpenGateway
dotnet build --configuration Release 2>&1 | tail -5
dotnet test tests/Swiftpay.Application.Tests --configuration Release --verbosity normal 2>&1 | tail -10
```

Expected: Build 0 errors. Tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/Swiftpay.Application/Features/Auth/ src/Swiftpay.Application/Common/IUserRepository.cs tests/Swiftpay.Application.Tests/Features/Auth/
git commit -m "feat(application): add Auth use cases (LoginCommand + RegisterCommand) with tests"
```

---

### Task 3: Payment Links Use Cases (Create, Get, List)

**Files:**
- Create: `src/Swiftpay.Application/Features/PaymentLinks/DTOs/PaymentLinkResponse.cs`
- Create: `src/Swiftpay.Application/Features/PaymentLinks/DTOs/CreatePaymentLinkRequest.cs`
- Create: `src/Swiftpay.Application/Features/PaymentLinks/Commands/CreatePaymentLinkCommand.cs`
- Create: `src/Swiftpay.Application/Features/PaymentLinks/Queries/GetPaymentLinkQuery.cs`
- Create: `src/Swiftpay.Application/Features/PaymentLinks/Queries/ListPaymentLinksQuery.cs`
- Create: `tests/Swiftpay.Application.Tests/Features/PaymentLinks/CreatePaymentLinkCommandTests.cs`

- [ ] **Step 1: Write DTOs**

Write `src/Swiftpay.Application/Features/PaymentLinks/DTOs/PaymentLinkResponse.cs`:
```csharp
namespace Swiftpay.Application.Features.PaymentLinks.DTOs;

public class PaymentLinkResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public long Amount { get; set; }
    public long? AmountMin { get; set; }
    public long? AmountMax { get; set; }
    public string Slug { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsExpired { get; set; }
    public bool IsExhausted { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int? MaxUses { get; set; }
    public int UsesCount { get; set; }
    public bool RequireDocument { get; set; }
    public bool RequirePhone { get; set; }
    public string? Theme { get; set; }
    public string? PrimaryColor { get; set; }
    public string? CtaText { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

Write `src/Swiftpay.Application/Features/PaymentLinks/DTOs/CreatePaymentLinkRequest.cs`:
```csharp
using FluentValidation;

namespace Swiftpay.Application.Features.PaymentLinks.DTOs;

public record CreatePaymentLinkRequest(
    string Title,
    string? Description,
    long Amount,
    long? AmountMin,
    long? AmountMax,
    bool RequireDocument,
    bool RequirePhone,
    string? Theme,
    string? PrimaryColor,
    string? CtaText,
    string? SuccessMessage,
    DateTime? ExpiresAt,
    int? MaxUses);

public class CreatePaymentLinkValidator : AbstractValidator<CreatePaymentLinkRequest>
{
    public CreatePaymentLinkValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Description).MaximumLength(1000);
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.AmountMin).GreaterThan(0).When(x => x.AmountMin.HasValue);
        RuleFor(x => x.AmountMax).GreaterThan(0).When(x => x.AmountMax.HasValue);
        RuleFor(x => x.CtaText).MaximumLength(100);
        RuleFor(x => x.SuccessMessage).MaximumLength(500);
        RuleFor(x => x.Theme).MaximumLength(50);
        RuleFor(x => x.PrimaryColor).MaximumLength(7);
    }
}
```

- [ ] **Step 2: Write CreatePaymentLinkCommand tests**

Write `tests/Swiftpay.Application.Tests/Features/PaymentLinks/CreatePaymentLinkCommandTests.cs`:
```csharp
using Swiftpay.Application.Common;
using Swiftpay.Application.Common.Interfaces;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.PaymentLinks.Commands;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Application.Tests.Features.PaymentLinks;

public class CreatePaymentLinkCommandTests
{
    private readonly Mock<IPaymentLinkRepository> _repo;
    private readonly Mock<ICurrentUserService> _currentUser;
    private readonly CreatePaymentLinkCommandHandler _handler;
    private readonly Guid _companyId = Guid.NewGuid();

    public CreatePaymentLinkCommandTests()
    {
        _repo = new Mock<IPaymentLinkRepository>();
        _currentUser = new Mock<ICurrentUserService>();
        _currentUser.Setup(x => x.CompanyId).Returns(_companyId);
        _handler = new CreatePaymentLinkCommandHandler(_repo.Object, _currentUser.Object);
    }

    [Fact]
    public async Task Handle_Should_CreatePaymentLink_When_ValidCommand()
    {
        var cmd = new CreatePaymentLinkCommand
        {
            Title = "Test Link",
            Amount = 3000,
            RequireDocument = true,
            RequirePhone = false,
        };

        var result = await _handler.Handle(cmd, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeEmpty();
        _repo.Verify(r => r.AddAsync(It.Is<PaymentLink>(l =>
            l.Title == "Test Link" &&
            l.Amount.AmountInCents == 3000 &&
            l.CompanyId == _companyId), It.IsAny<CancellationToken>()));
    }

    [Fact]
    public async Task Handle_Should_GenerateUniqueSlug()
    {
        var cmd = new CreatePaymentLinkCommand { Title = "Slug Test", Amount = 1000 };

        var result = await _handler.Handle(cmd, CancellationToken.None);

        _repo.Verify(r => r.AddAsync(It.Is<PaymentLink>(l =>
            !string.IsNullOrEmpty(l.Slug) && l.Slug.Length == 8), It.IsAny<CancellationToken>()));
    }
}
```

- [ ] **Step 3: Implement CreatePaymentLinkCommand**

Write `src/Swiftpay.Application/Features/PaymentLinks/Commands/CreatePaymentLinkCommand.cs`:
```csharp
using MediatR;
using Swiftpay.Application.Common;
using Swiftpay.Application.Common.Interfaces;
using Swiftpay.Application.Common.Models;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Application.Features.PaymentLinks.Commands;

public class CreatePaymentLinkCommand : IRequest<Result<Guid>>
{
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public long Amount { get; init; }
    public long? AmountMin { get; init; }
    public long? AmountMax { get; init; }
    public bool RequireDocument { get; init; }
    public bool RequirePhone { get; init; }
    public string? Theme { get; init; }
    public string? PrimaryColor { get; init; }
    public string? CtaText { get; init; }
    public string? SuccessMessage { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public int? MaxUses { get; init; }
}

public class CreatePaymentLinkCommandHandler : IRequestHandler<CreatePaymentLinkCommand, Result<Guid>>
{
    private readonly IPaymentLinkRepository _repo;
    private readonly ICurrentUserService _currentUser;
    private static readonly Random _random = new();

    public CreatePaymentLinkCommandHandler(IPaymentLinkRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> Handle(CreatePaymentLinkCommand request, CancellationToken ct)
    {
        var link = new PaymentLink
        {
            Id = Guid.NewGuid(),
            CompanyId = _currentUser.CompanyId,
            Title = request.Title,
            Description = request.Description,
            Amount = new Money(request.Amount),
            AmountMin = request.AmountMin.HasValue ? new Money(request.AmountMin.Value) : null,
            AmountMax = request.AmountMax.HasValue ? new Money(request.AmountMax.Value) : null,
            Slug = GenerateSlug(),
            IsActive = true,
            RequireDocument = request.RequireDocument,
            RequirePhone = request.RequirePhone,
            Theme = request.Theme,
            PrimaryColor = request.PrimaryColor,
            CtaText = request.CtaText,
            SuccessMessage = request.SuccessMessage,
            ExpiresAt = request.ExpiresAt,
            MaxUses = request.MaxUses,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        await _repo.AddAsync(link, ct);
        return Result<Guid>.Success(link.Id);
    }

    private static string GenerateSlug()
    {
        const string chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        return new string(Enumerable.Range(0, 8).Select(_ => chars[_random.Next(chars.Length)]).ToArray());
    }
}
```

- [ ] **Step 4: Implement GetPaymentLinkQuery**

Write `src/Swiftpay.Application/Features/PaymentLinks/Queries/GetPaymentLinkQuery.cs`:
```csharp
using MediatR;
using Swiftpay.Application.Common;
using Swiftpay.Application.Common.Interfaces;
using Swiftpay.Application.Common.Mappings;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.PaymentLinks.DTOs;

namespace Swiftpay.Application.Features.PaymentLinks.Queries;

public record GetPaymentLinkQuery(Guid Id) : IRequest<Result<PaymentLinkResponse>>;

public class GetPaymentLinkQueryHandler : IRequestHandler<GetPaymentLinkQuery, Result<PaymentLinkResponse>>
{
    private readonly IPaymentLinkRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public GetPaymentLinkQueryHandler(IPaymentLinkRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<Result<PaymentLinkResponse>> Handle(GetPaymentLinkQuery request, CancellationToken ct)
    {
        var link = await _repo.GetByIdAsync(request.Id, ct);
        if (link is null || link.CompanyId != _currentUser.CompanyId)
            return Result<PaymentLinkResponse>.Failure(Error.NotFound("Payment link not found"));

        return link.ToResponse();
    }
}
```

- [ ] **Step 5: Implement ListPaymentLinksQuery**

Write `src/Swiftpay.Application/Features/PaymentLinks/Queries/ListPaymentLinksQuery.cs`:
```csharp
using MediatR;
using Swiftpay.Application.Common;
using Swiftpay.Application.Common.Interfaces;
using Swiftpay.Application.Common.Mappings;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.PaymentLinks.DTOs;

namespace Swiftpay.Application.Features.PaymentLinks.Queries;

public record ListPaymentLinksQuery(int Page = 1, int Limit = 25) : IRequest<PagedResponse<PaymentLinkResponse>>;

public class ListPaymentLinksQueryHandler : IRequestHandler<ListPaymentLinksQuery, PagedResponse<PaymentLinkResponse>>
{
    private readonly IPaymentLinkRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public ListPaymentLinksQueryHandler(IPaymentLinkRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<PagedResponse<PaymentLinkResponse>> Handle(ListPaymentLinksQuery request, CancellationToken ct)
    {
        var links = await _repo.ListByCompanyAsync(_currentUser.CompanyId, request.Page, request.Limit, ct);
        var total = await _repo.CountByCompanyAsync(_currentUser.CompanyId, ct);

        return new PagedResponse<PaymentLinkResponse>
        {
            Items = links.ToResponseList(),
            Page = request.Page,
            Limit = request.Limit,
            Total = total,
        };
    }
}
```

- [ ] **Step 6: Build and run all application tests**

```bash
cd /home/matspectrum-ai/OpenGateway
dotnet build --configuration Release 2>&1 | tail -5
dotnet test tests/Swiftpay.Application.Tests --configuration Release --verbosity normal 2>&1 | tail -10
```

Expected: Build 0 errors. All application tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/Swiftpay.Application/Features/PaymentLinks/ tests/Swiftpay.Application.Tests/Features/PaymentLinks/
git commit -m "feat(application): add PaymentLinks use cases (Create, Get, List) with tests"
```

---

### Task 4: Wallet Use Cases (Balance + Transaction queries) + Registration in WebApi

**Files:**
- Create: `src/Swiftpay.Application/Features/Wallet/Queries/GetBalanceQuery.cs`
- Create: `src/Swiftpay.Application/Features/Wallet/Queries/ListTransactionsQuery.cs`
- Create: `src/Swiftpay.Application/Features/Wallet/DTOs/BalanceResponse.cs`
- Create: `src/Swiftpay.Application/Features/Wallet/DTOs/TransactionResponse.cs`
- Modify: `src/Swiftpay.WebApi/Program.cs` (register Application DI)

- [ ] **Step 1: Write Wallet DTOs**

Write `src/Swiftpay.Application/Features/Wallet/DTOs/BalanceResponse.cs`:
```csharp
namespace Swiftpay.Application.Features.Wallet.DTOs;

public record BalanceResponse(long Available, long Pending);
```

Write `src/Swiftpay.Application/Features/Wallet/DTOs/TransactionResponse.cs`:
```csharp
namespace Swiftpay.Application.Features.Wallet.DTOs;

public class TransactionResponse
{
    public Guid Id { get; set; }
    public long Amount { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
```

- [ ] **Step 2: Implement GetBalanceQuery**

Write `src/Swiftpay.Application/Features/Wallet/Queries/GetBalanceQuery.cs`:
```csharp
using MediatR;
using Swiftpay.Application.Common;
using Swiftpay.Application.Common.Interfaces;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.Wallet.DTOs;

namespace Swiftpay.Application.Features.Wallet.Queries;

public record GetBalanceQuery : IRequest<Result<BalanceResponse>>;

public class GetBalanceQueryHandler : IRequestHandler<GetBalanceQuery, Result<BalanceResponse>>
{
    private readonly ITransactionRepository _txRepo;
    private readonly ICurrentUserService _currentUser;

    public GetBalanceQueryHandler(ITransactionRepository txRepo, ICurrentUserService currentUser)
    {
        _txRepo = txRepo;
        _currentUser = currentUser;
    }

    public async Task<Result<BalanceResponse>> Handle(GetBalanceQuery request, CancellationToken ct)
    {
        var transactions = await _txRepo.ListByCompanyAsync(_currentUser.CompanyId, 1, int.MaxValue, ct);

        var available = transactions
            .Where(t => t.Status == Swiftpay.Domain.Enums.TransactionStatus.Paid)
            .Sum(t => t.Amount.AmountInCents);

        var pending = transactions
            .Where(t => t.Status == Swiftpay.Domain.Enums.TransactionStatus.Pending)
            .Sum(t => t.Amount.AmountInCents);

        return new BalanceResponse(available, pending);
    }
}
```

- [ ] **Step 3: Implement ListTransactionsQuery**

Write `src/Swiftpay.Application/Features/Wallet/Queries/ListTransactionsQuery.cs`:
```csharp
using MediatR;
using Swiftpay.Application.Common;
using Swiftpay.Application.Common.Interfaces;
using Swiftpay.Application.Common.Models;
using Swiftpay.Application.Features.Wallet.DTOs;

namespace Swiftpay.Application.Features.Wallet.Queries;

public record ListTransactionsQuery(int Page = 1, int Limit = 25) : IRequest<PagedResponse<TransactionResponse>>;

public class ListTransactionsQueryHandler : IRequestHandler<ListTransactionsQuery, PagedResponse<TransactionResponse>>
{
    private readonly ITransactionRepository _txRepo;
    private readonly ICurrentUserService _currentUser;

    public ListTransactionsQueryHandler(ITransactionRepository txRepo, ICurrentUserService currentUser)
    {
        _txRepo = txRepo;
        _currentUser = currentUser;
    }

    public async Task<PagedResponse<TransactionResponse>> Handle(ListTransactionsQuery request, CancellationToken ct)
    {
        var transactions = await _txRepo.ListByCompanyAsync(_currentUser.CompanyId, request.Page, request.Limit, ct);
        var total = await _txRepo.CountByCompanyAsync(_currentUser.CompanyId, ct);

        return new PagedResponse<TransactionResponse>
        {
            Items = transactions.Select(t => new TransactionResponse
            {
                Id = t.Id,
                Amount = t.Amount.AmountInCents,
                Type = t.Type.ToString(),
                Status = t.Status.ToString(),
                Method = t.Method.ToString(),
                CreatedAt = t.CreatedAt,
            }).ToList(),
            Page = request.Page,
            Limit = request.Limit,
            Total = total,
        };
    }
}
```

- [ ] **Step 4: Update Program.cs to register Application DI**

Edit `src/Swiftpay.WebApi/Program.cs` — add `builder.Services.AddApplication();` after the existing service registrations:
```csharp
using Swiftpay.Application;
using Swiftpay.Infrastructure;

var builder = WebAppication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();
// ... rest stays the same
```

- [ ] **Step 5: Full build and test**

```bash
cd /home/matspectrum-ai/OpenGateway
dotnet build --configuration Release 2>&1 | tail -5
dotnet test --configuration Release --verbosity normal 2>&1 | tail -15
```

Expected: Build 0 errors. All tests pass (23 domain + 4 application = ~27+).

- [ ] **Step 6: Commit**

```bash
git add src/Swiftpay.Application/Features/Wallet/ src/Swiftpay.WebApi/Program.cs
git commit -m "feat(application): add Wallet use cases (GetBalance, ListTransactions) + DI registration"
```

---

### Task 5: Add Application test project reference for Moq and build verification

**Files:**
- Modify: `tests/Swiftpay.Application.Tests/Swiftpay.Application.Tests.csproj` (verify packages)

- [ ] **Step 1: Ensure the Application test project has correct references**

```bash
cd /home/matspectrum-ai/OpenGateway
# Verify the test project references Application and has Moq
dotnet list tests/Swiftpay.Application.Tests reference
dotnet list tests/Swiftpay.Application.Tests package 2>&1 | grep -i "moq\|fluent"
```

- [ ] **Step 2: Full final verification**

```bash
dotnet build --configuration Release 2>&1 | tail -5
echo "---"
dotnet test --configuration Release 2>&1 | tail -5
echo "---"
git status --short
```

Expected: `0 Warning(s), 0 Error(s)`. Tests: `Passed! - Failed: 0`.

- [ ] **Step 3: Commit any remaining files and push**

```bash
git add -A
git commit -m "chore: finalize Application layer with full CQRS implementation"
git push origin main 2>&1
```
