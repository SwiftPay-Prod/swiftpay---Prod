# Swiftpay Development Workflow

## Implementation Order (MANDATORY)
1. **Domain** -- entities, value objects, enums
2. **Application** -- use cases, DTOs, interfaces
3. **Infrastructure** -- EF Core, repos, services
4. **WebApi** -- controllers, middleware
5. **Frontend** -- Next.js pages (separate phase)

## Per-Feature Steps
1. Write domain tests (TDD)
2. Implement domain entities
3. Write application tests (TDD)
4. Implement use cases
5. Write infrastructure tests
6. Implement repositories + services
7. Wire up controllers
8. Commit

## Rules
- Always read this file and other skills before starting
- Each step must have tests before implementation code
- Commits must be atomic (one commit per step)
- Use superpowers workflow: writing-plans -> TDD -> review -> finish
- Use dotnet/skills for technical .NET questions
