# Al Haditha Hostel Allotment Management System
## Phase 1: Software Architecture, Database Design & Project Foundation

An enterprise-grade, maintainable accommodation and stay-management platform built on the MERN stack (MongoDB Atlas, Express.js, React, Node.js) with end-to-end TypeScript and Tailwind CSS.

---

## 1. Project Overview

The **Al Haditha Hostel Allotment Management System** manages physical accommodation bootcamps permanently categorized across three employee seniority tiers:
- **VIP**: 1 employee per entire bootcamp (`WHOLE` unit).
- **Senior**: 2 employees per bootcamp across 2 independent portions (`PORTION` units).
- **Junior**: 6 employees per bootcamp across 2 portions and 3 individual beds per portion (`BED` units).

---

## 2. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express.js, TypeScript, REST Architecture (`/api/v1`)
- **Database**: MongoDB Atlas, Mongoose ODM (Multi-Document Transactions)
- **Validation & Security**: Zod, JSON Web Tokens (JWT), bcrypt
- **Architecture**: Modular Monolith

---

## 3. Monorepo Structure

```
alhaditha-hostel-management/
├── docs/                # Foundational architecture, database, & API specs
├── server/              # Express + TypeScript Modular Monolith Backend
│   ├── src/config/      # Typed configuration & DB connection
│   ├── src/constants/   # Domain enums (VIP, Senior, Junior, etc.)
│   ├── src/controllers/ # HTTP Request/Response boundaries
│   ├── src/middleware/  # Auth, validation, error handler
│   ├── src/models/      # Mongoose schemas & compound partial indexes
│   ├── src/routes/      # Versioned routes (/api/v1)
│   ├── src/services/    # Domain rules & transactional logic
│   ├── src/types/       # TypeScript interfaces & DTOs
│   ├── src/utils/       # Response formatters & date calculators
│   └── src/validations/ # Zod request validation schemas
├── client/              # React + Vite + TypeScript Frontend
│   └── src/
│       ├── components/  # Layout and shared UI primitives
│       ├── features/    # Domain modules (Allotments, Employees, Bootcamps, etc.)
│       ├── hooks/       # Custom hooks
│       ├── services/    # Typed API client
│       └── types/       # Shared TypeScript definitions
├── package.json         # Workspace orchestration
└── README.md
```

---

## 4. Getting Started

### Prerequisites
- Node.js >= 18.x (tested on v24.x)
- npm >= 9.x
- MongoDB Atlas cluster or local MongoDB instance supporting replica sets (for multi-document transactions)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd "Al haditha hostel"

# Install all workspace dependencies
npm install
```

### Environment Configuration
1. Copy `.env.example` in `server/` to `server/.env` and update values:
   ```bash
   cp server/.env.example server/.env
   ```
2. Copy `.env.example` in `client/` to `client/.env` and update values:
   ```bash
   cp client/.env.example client/.env
   ```

### Running in Development
```bash
# Start backend server
npm run dev:server

# Start frontend application
npm run dev:client
```

---

## 5. Architectural Documentation
All technical deliverables reside in the `/docs` directory:
- [requirements.md](docs/requirements.md): Business requirements & invariants.
- [system-architecture.md](docs/system-architecture.md): Modular monolithic design & diagrams.
- [database-design.md](docs/database-design.md): MongoDB schemas, data types, indexes, and samples.
- [entity-relationship.md](docs/entity-relationship.md): ER diagram and category structural breakdowns.
- [api-design.md](docs/api-design.md): REST API endpoints and payload contracts.
- [project-structure.md](docs/project-structure.md): Workspace folder organization and layer responsibilities.
- [business-rules.md](docs/business-rules.md): Category rules, concurrency locking, and stay logic.
- [architecture-decisions.md](docs/architecture-decisions.md): Architecture Decision Records (ADR 001–005).
