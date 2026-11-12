# Project Structure & Monorepo Organization
## Project: Al Haditha Hostel Allotment Management System

---

## 1. Monorepo Organization

```
al-haditha-hostel-management/
├── .gitignore                     # Monorepo-wide exclusions
├── .env.example                   # Master environment template
├── package.json                   # Root monorepo workspace configuration
├── README.md                      # Operational & architectural guide
├── logo-DIdpluGP.png              # Workspace visual asset
├── docs/                          # Architecture & technical governance documents
│   ├── requirements.md
│   ├── system-architecture.md
│   ├── database-design.md
│   ├── entity-relationship.md
│   ├── api-design.md
│   ├── project-structure.md
│   ├── business-rules.md
│   └── architecture-decisions.md
├── server/                        # Express + TypeScript Modular Monolith
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── config/                # Environment variables, DB connection, Swagger setup
│       ├── constants/             # Enums, roles, status codes, business constants
│       ├── controllers/           # HTTP handlers (Request/Response mapping)
│       ├── middleware/            # Auth, validation, error handler, CORS
│       ├── models/                # Mongoose schemas, interfaces, compound indexes
│       ├── routes/                # Express versioned routing (/api/v1)
│       ├── services/              # Domain logic, transactions, allocation rules
│       ├── types/                 # Express, DTO, and common domain types
│       ├── utils/                 # Date math, response wrappers, logger
│       ├── validations/           # Zod schema definitions
│       └── index.ts               # Server entry point
└── client/                        # React + Vite + TypeScript Frontend
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── vite.config.ts
    └── src/
        ├── assets/                # Logos, static icons
        ├── components/
        │   ├── common/            # Reusable UI primitives (Button, Modal, Badge, Card)
        │   └── layout/            # App shell, Navbar, Sidebar
        ├── config/                # Environment config, navigation links
        ├── features/              # Feature-based domain modules
        │   ├── allotments/        # Allotment forms, active list, check-in/out modal
        │   ├── auth/              # Admin login context & component
        │   ├── bootcamps/         # Bootcamp cards, unit availability grid
        │   ├── dashboard/         # Occupancy overview, stat counters
        │   ├── employees/         # Employee registration & selector
        │   └── notifications/     # Overdue, due-today, upcoming alert lists
        ├── hooks/                 # Reusable React hooks (useAuth, useDebounce, etc.)
        ├── routes/                # Client-side router configuration (React Router)
        ├── services/              # Typed API communication clients
        ├── types/                 # Shared frontend TypeScript interfaces
        ├── utils/                 # Date formatting, Tailwind class merging (cn)
        ├── App.tsx                # App root component
        ├── index.css              # Tailwind imports
        └── main.tsx               # Client DOM entry point
```

---

## 2. Server Architectural Responsibilities

- `config/`: Centralizes typed configuration (`env.ts`), database connectivity lifecycle (`database.ts`), and Swagger documentation bindings.
- `constants/`: Eliminates magic strings. Houses status enums (`EmployeeCategory`, `AllocationUnitType`, `AllotmentStatus`).
- `controllers/`: Strictly responsible for reading HTTP request parameters, delegating to the appropriate service, and rendering the uniform JSON API response.
- `services/`: Encapsulates all domain logic. No controller directly touches Mongoose models. Transactions (e.g. reserving a unit while creating an allotment) reside here.
- `models/`: Contains Mongoose schemas with compound indexes, partial filter indexes, and schema-level validation constraints.
- `middleware/`: Houses `authMiddleware` (JWT validation), `validate` (Zod validation bridge), and `errorHandler` (centralized Express error catcher).
- `validations/`: Houses Zod schemas ensuring runtime type-safety before payloads reach controllers.

---

## 3. Client Architectural Responsibilities

- **Feature-Driven Architecture**: Code is grouped by business domain rather than technical function (`features/allotments`, `features/bootcamps`, etc.).
- `features/*`: Each feature folder contains its dedicated UI components, local state, and specialized hooks.
- `components/common/`: Shared, reusable, non-domain components (e.g., generic table, modal, alert banner).
- `services/apiClient.ts`: Single point of Axios/Fetch configuration with automatic JWT injection, base URL handling, and standardized error response unwrapping.
- **State Management**: Simple React Context for the administrative user session (`AuthContext`). All other state remains local to features to prevent state pollution and unnecessary re-renders.
