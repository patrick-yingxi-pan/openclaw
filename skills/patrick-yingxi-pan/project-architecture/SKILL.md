---
name: project-architecture
description: System architecture design for building robust, scalable applications. Use when designing 3-layer architectures, data models, tech stack selection, or application layer organization.
---

# Project Architecture

Systematic approach to designing robust, maintainable system architectures.

## Core Principles

### 1. Separation of Concerns

Divide the system into distinct layers with clear responsibilities:

- **Presentation Layer** - User interface, API endpoints
- **Application Layer** - Business logic, workflow orchestration
- **Data Layer** - Persistence, storage, external services

### 2. Single Responsibility Principle

Each component should have one primary purpose and do it well.

### 3. Dependency Inversion

Depend on abstractions, not concretions. High-level modules shouldn't depend on low-level modules.

## Architecture Patterns

### 3-Layer Architecture

```
┌─────────────────────────────────┐
│   Presentation Layer             │  ← API routes, UI components
├─────────────────────────────────┤
│   Application Layer              │  ← Services, use cases, workflows
├─────────────────────────────────┤
│   Data Layer                     │  ← Repositories, databases, storage
└─────────────────────────────────┘
```

**Presentation Layer Responsibilities:**

- Request/response handling
- Input validation
- Authentication/authorization
- Response formatting

**Application Layer Responsibilities:**

- Business logic
- Transaction management
- Workflow orchestration
- Service coordination

**Data Layer Responsibilities:**

- Data persistence
- Query execution
- File storage
- External API calls

### Directory Structure

```
project/
├── src/
│   ├── api/              # Presentation layer (routes, controllers)
│   ├── services/         # Application layer (business logic)
│   ├── models/           # Data models and types
│   ├── repositories/     # Data access layer
│   └── lib/              # Utilities and helpers
└── prisma/               # Database schema
```

## Tech Stack Selection

### Decision Framework

1. **Problem Fit** - Does the technology solve the specific problem?
2. **Team Expertise** - Can the team maintain it long-term?
3. **Ecosystem** - Is there good tooling, documentation, and community?
4. **Scalability** - Will it grow with the project?
5. **Maintenance Cost** - What's the total cost of ownership?

### Common Stack Components

- **Web Framework**: Next.js, Express, FastAPI
- **Database**: PostgreSQL (relational), MongoDB (document)
- **ORM**: Prisma, TypeORM, SQLAlchemy
- **Validation**: Zod, Joi, Pydantic
- **File Storage**: Local filesystem, S3, Cloud Storage

## Data Modeling

### Schema Design Principles

1. **Normalize for integrity**, denormalize for performance
2. **Use enums** for fixed value sets
3. **Add timestamps** (`createdAt`, `updatedAt`) to all entities
4. **Use foreign keys** for referential integrity
5. **Index frequently queried fields**

### Example: Tina Design Platform Models

- **Case**: Design case with metadata
- **MediaFile**: Images/videos with storage locations
- **Task**: Long-running task with state machine
- **TaskCheckpoint**: Recovery points for tasks
- **OperationLog**: Write-ahead log for operations

## Practical Patterns

### Service Pattern

Create dedicated service classes for business logic:

```typescript
export class MediaFileService {
  async uploadFile(caseId: string, filePath: string) { ... }
  async downloadFile(mediaFileId: string) { ... }
}
```

### Repository Pattern

Abstract data access behind repository interfaces.

### Dependency Injection

Pass dependencies into services rather than hardcoding them.

## Example: Tina Design Platform Architecture

- **Presentation**: Next.js API routes
- **Application**: MediaFileService, TaskService, CheckpointService
- **Data**: Prisma ORM + PostgreSQL, local file storage
