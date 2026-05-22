# Swiftpay Clean Architecture

## Layer Rules
- **Domain**: ZERO external dependencies. Pure C# classes only.
- **Application**: Depends only on Domain. Interfaces for repositories.
- **Infrastructure**: Implements Application interfaces. EF Core, JWT, etc.
- **WebApi**: Composition root. Registers all dependencies.

## Project References
- Domain <- (no dependencies)
- Application -> Domain
- Infrastructure -> Application (NOT Domain directly)
- WebApi -> Infrastructure

## Naming Conventions
- Projects: `Swiftpay.{Layer}` (e.g., Swiftpay.Domain)
- Tests: `Swiftpay.{Layer}.Tests`
- Files: PascalCase for all C# files
- Folders: PascalCase

## Dependency Injection
- Each layer has `DependencyInjection.cs` with extension method
- Infrastructure registers DbContext, Repositories, JwtService
- Application registers MediatR handlers
- WebApi calls all layer registrations in Program.cs
