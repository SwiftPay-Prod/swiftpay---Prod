# Swiftpay Testing Conventions

## TDD is MANDATORY
Every feature: RED (write failing test) -> GREEN (minimal code) -> REFACTOR

## Test Framework
- xUnit.net (not NUnit, not MSTest)
- FluentAssertions for assertions
- Moq for mocking (or NSubstitute)

## Naming Convention
{MethodName}_Should_{ExpectedBehavior}_When_{Condition}
Example: `CreatePaymentLink_Should_ReturnSlug_When_ValidInput()`

## Project Structure
- One test project per source project
- Mirror the source namespace structure
- Tests/ folder mirrors src/ folder

## Domain Tests
- Pure unit tests (no mocking needed)
- Test entity behavior, invariants, rules

## Application Tests
- Mock repository interfaces
- Test use case logic

## Infrastructure Tests
- EF Core InMemory for repository tests
- Integration tests for real DB (separate category)

## Commands
dotnet test ./tests/Swiftpay.Domain.Tests
dotnet test ./tests/Swiftpay.Application.Tests
dotnet test (solution) --filter "Category!=Integration"
