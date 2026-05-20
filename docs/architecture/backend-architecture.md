# Backend Architecture (Clean + Vertical Slice)

Cayeshni’s backend combines **Clean Architecture** with **Vertical Slice** feature organization. Clean Architecture defines the dependency direction and boundaries. Vertical Slice keeps each feature’s use cases and models together for clarity and change isolation.

## Clean Architecture Layers

- **API** ([backend/Cayeshni.API](../../backend/Cayeshni.API))
  - HTTP endpoints, middleware, request/response contracts
  - Authentication, authorization, and cross‑cutting concerns

- **Application** ([backend/Cayeshni.Application](../../backend/Cayeshni.Application))
  - Business use cases and feature orchestration
  - Validation, DTOs, and application‑level policies

- **Domain** ([backend/Cayeshni.Domain](../../backend/Cayeshni.Domain))
  - Core entities, enums, and domain rules
  - Pure logic without infrastructure dependencies

- **Infrastructure** ([backend/Cayeshni.Infrastructure](../../backend/Cayeshni.Infrastructure))
  - Persistence (EF Core), identity, external services
  - Implements interfaces used by Application

**Dependency direction:** API → Application → Domain, and Infrastructure → Application/Domain (never the other way around).

## Vertical Slice Organization

Within the Application layer, features are grouped by capability in [backend/Cayeshni.Application/Features](../../backend/Cayeshni.Application/Features):

- Auth
- Users
- Groups
- Friends
- Transactions
- Settlements
- Dashboard

Each feature owns its:

- **DTOs**: request/response contracts specific to that feature
- **Services**: business logic and orchestration
- **Repository interfaces**: data access contracts for that feature

**Shared abstractions** live in [backend/Cayeshni.Application/Common](../../backend/Cayeshni.Application/Common):

- **Interfaces**: service abstractions (IEmailService, IJwtService, IIdentityService, etc.)
- **Exceptions**: common domain and application exceptions

Infrastructure implements both the repository interfaces and service interfaces, maintaining the dependency rule (Application → Domain, Infrastructure → Application/Domain).

## Request Flow (Simplified)

1. **Controller** in API receives the HTTP request
2. **Application feature** handles the use case (validation + business logic)
3. **Infrastructure** persists or retrieves data via EF Core
4. Response DTO is returned to the controller

## Why this works well

- **Testability**: domain and application logic are isolated from infrastructure
- **Maintainability**: feature changes remain localized
- **Scalability**: new features fit naturally into the slice structure
- **Clarity**: consistent folder layout and dependency rules
