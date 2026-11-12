# System Architecture Document
## Project: Al Haditha Hostel Allotment Management System

---

## 1. Architecture Paradigm: Modular Monolith
The Al Haditha Hostel Allotment Management System is architected as a **Modular Monolith** using the MERN stack (MongoDB, Express.js, React, Node.js) with end-to-end TypeScript. 

### Why a Modular Monolith?
- **Domain Simplicity & Consistency**: The system centers on cohesive transactions (reserving an allocation unit and binding an allotment). A modular monolith enables single-database ACID transactions (MongoDB Multi-Document Transactions) without the latency, complexity, and distributed failure states of microservices.
- **Strict Boundary Separation**: Business boundaries (Employees, Bootcamps, AllocationUnits, Allotments, Notifications, Users) are enforced via distinct modular directories, services, and types rather than physical network boundaries.
- **Developer Velocity & Maintainability**: Single codebase with clear monorepo workspaces for server and client.

---

## 2. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|                                                                                   |
|   React (Vite + TypeScript + Tailwind CSS)                                        |
|   +---------------------------------------------------------------------------+   |
|   | Feature Modules:                                                          |   |
|   | [Auth]  [Dashboard]  [Employees]  [Bootcamps]  [Allotments] [Notifications] |
|   +---------------------------------------------------------------------------+   |
|                                     | HTTP/REST (JSON)                            |
|                                     v Axios/Fetch Client                          |
+-------------------------------------+---------------------------------------------+
                                      |
                                      | HTTPS (Reverse Proxy / Direct)
                                      v
+-------------------------------------+---------------------------------------------+
|                                 SERVER TIER                                       |
|                                                                                   |
|   Node.js + Express (TypeScript)                                                  |
|   +---------------------------------------------------------------------------+   |
|   | Global Middleware Pipeline:                                               |   |
|   | [CORS] -> [Security Headers] -> [JSON Parser] -> [JWT Auth Middleware]   |   |
|   +---------------------------------------------------------------------------+   |
|   | Routing Layer: `/api/v1`                                                  |   |
|   | [/auth]    [/employees]    [/bootcamps]    [/allotments]   [/notifications]  |   |
|   +---------------------------------------------------------------------------+   |
|   | Validation Layer:                                                         |   |
|   | Zod Request Schemas (Body, Query, Params)                                |   |
|   +---------------------------------------------------------------------------+   |
|   | Controller Layer:                                                         |   |
|   | Request extraction, response formatting, status mapping                   |   |
|   +---------------------------------------------------------------------------+   |
|   | Service Layer (Core Business Logic & Transactions):                       |   |
|   | [AllotmentService] [BootcampService] [EmployeeService] [NotificationService]  |
|   +---------------------------------------------------------------------------+   |
|   | Data Access Layer:                                                        |   |
|   | Mongoose Models & Schemas (Strict Types, Pre-hooks, Compound Indexes)     |   |
|   +---------------------------------------------------------------------------+   |
|                                     | Mongoose ODM Protocol                       |
+-------------------------------------+---------------------------------------------+
                                      |
                                      v
+-------------------------------------+---------------------------------------------+
|                                DATABASE TIER                                      |
|                                                                                   |
|   MongoDB Atlas (Replica Set)                                                     |
|   +---------------------------------------------------------------------------+   |
|   | Collections:                                                              |   |
|   | - users (Admins)                                                          |   |
|   | - employees (VIP, SENIOR, JUNIOR)                                         |   |
|   | - bootcamps (Category fixed)                                              |   |
|   | - allocation_units (WHOLE, PORTION, BED with occupancy locks)             |   |
|   | - allotments (Lifecycle status, check-in/out timestamps)                   |   |
|   +---------------------------------------------------------------------------+   |
|   | ACID Guarantees: Multi-Document Transactions for Allotment Creation & Exit  |   |
+-----------------------------------------------------------------------------------+
```

---

## 3. Tier Responsibilities & Communication

### 3.1. Client Tier (Frontend)
- **Role**: Presentation, validation formatting, user-driven actions, local routing.
- **State Management**:
  - React Context for cross-cutting global concerns (Authentication Session & User Profile).
  - Local state (`useState`, `useReducer`, or custom hooks) for feature views, forms, filters, and modal workflows.
  - Zero heavy external state stores (like Redux) to prevent over-engineering.
- **Communication**: Asynchronous HTTP calls using a strongly typed API service wrapper (`apiClient.ts`). Authentication tokens are communicated via standard `Authorization: Bearer <token>` headers.

### 3.2. Server Tier (Backend)
- **Layered Flow**:
  1. **Router**: Dispatches endpoint to matching controller.
  2. **Middleware**: Authenticates JWT, enforces roles, and validates incoming data via Zod schema parsers.
  3. **Controller**: Pure HTTP boundary. Reads `req`, passes typed DTO to service, wraps service return in standardized JSON structure (`{ success: true, data: ... }`), and sends status.
  4. **Service**: Encapsulates all domain logic, invariants, business rule checks, and database session orchestration.
  5. **Data Access (Mongoose)**: Manages persistence, indexes, and document mapping.

### 3.3. Database Tier (MongoDB Atlas)
- Document-oriented, scalable storage configured as a Replica Set to enable multi-document ACID transactions.
- Strongly structured schemas with schema-level validation, strict enum enforcement, and unique/compound indexes.

---

## 4. Cross-Cutting Architectural Concerns

### 4.1. Security Architecture
- **Authentication**: Stateless JSON Web Tokens (JWT) signed with HMAC-SHA256. Tokens have a deterministic lifetime (e.g., 8 hours).
- **Password Protection**: Passwords hashed using `bcrypt` with a minimum salt rounds factor of 10.
- **Input Sanitization & Validation**: Strict Zod schemas reject unexpected fields (strip or error) to eliminate injection and mass-assignment risks.
- **CORS Protection**: Restricted to trusted frontend domain origins defined via environment variables.

### 4.2. Concurrency Control & Race Prevention
- Allotment assignment utilizes atomic state changes. When allocating a unit:
  - MongoDB transaction opens.
  - The `AllocationUnit` is conditionally updated only if `isOccupied === false`.
  - If another administrator occupied the unit in parallel, the atomic write returns null/modifiedCount=0, triggering a concurrency conflict exception (`409 Conflict`).
  - Active allotment record is inserted.
  - Transaction commits.

### 4.3. Standardized API Response Contract
All endpoints adhere to a uniform response envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation"
}
```
In error states:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | CONFLICT | NOT_FOUND | UNAUTHORIZED | INTERNAL_ERROR",
    "message": "Descriptive error message",
    "details": [] 
  }
}
```
