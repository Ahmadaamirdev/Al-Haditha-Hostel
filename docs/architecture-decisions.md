# Architecture Decision Records (ADR)
## Project: Al Haditha Hostel Allotment Management System

---

## ADR 001: Granular Allocation Unit Collection vs. Embedded Subdocuments

### Status: APPROVED
### Context:
Bootcamps contain portions and beds with independent availabilities. We needed to choose between embedding portions/beds within the `Bootcamps` collection or normalizing them into an independent `AllocationUnits` collection.

### Decision:
We selected a normalized **`AllocationUnits`** collection where each bookable space (VIP Whole, Senior Portion, Junior Bed) is an autonomous document referencing its parent Bootcamp.

### Reasons:
1. **Concurrency Safety**: In MongoDB, locking or conditionally updating an array element inside a document under high concurrency can result in document-level race conditions. With separate documents, atomic updates (`findOneAndUpdate({ _id, isOccupied: false })`) are isolated to individual beds.
2. **Indexing Efficiency**: Partial unique indexes (`{ allocationUnitId: 1 }` where status in active) cannot be cleanly enforced on subdocument array elements.
3. **Checkout Independence**: Releasing a Junior bed updates exactly one small document without mutating the parent Bootcamp document.

---

## ADR 002: Modular Monolith vs. Microservices

### Status: APPROVED
### Context:
Selecting the software boundary pattern for the Al Haditha Hostel system.

### Decision:
Adopt a **Modular Monolith** architecture with clean domain folder separation in a monorepo structure.

### Reasons:
1. **ACID Transaction Guarantees**: Allotment and unit reservation require strict transactional atomicity. A single database allows direct MongoDB multi-document transactions without two-phase commit protocols or distributed sagas.
2. **Avoidance of Premature Complexity**: The domain does not have disparate scaling needs, complex event streams, or independent team boundaries that justify microservice operational overhead.
3. **Fast Development & Maintenance**: Simplified deployment and local testing.

---

## ADR 003: Frontend State Architecture (React Context vs. External Stores)

### Status: APPROVED
### Context:
Determining global state management requirements for the React + Vite frontend.

### Decision:
Rely exclusively on **React Context** for global session state (Authentication & Admin user profile) and local state (`useState`, `useReducer`, custom hooks) for feature views and forms. **Reject Redux / Zustand**.

### Reasons:
1. **Low Cross-Domain State Coupling**: Employee forms, bootcamp lists, and allotment workflows are distinct screens that fetch server state on demand.
2. **Eliminates Overengineering**: The application does not have complex offline synchronization, undo/redo histories, or intricate client-side caches that warrant external state libraries.

---

## ADR 004: Soft Preservation of Completed Allotments vs. UI History Module

### Status: APPROVED
### Context:
Business rules mandate that the user-facing application shows only active allotments and no history screen, while preserving the actual checkout record.

### Decision:
Store all allotment records in the `allotments` collection with an updated lifecycle status (`COMPLETED`), persisting `actualCheckoutDate`. Application queries and views are permanently filtered by `{ status: { $in: ['PENDING', 'CHECKED_IN'] } }`.

### Reasons:
1. **Preserves Audit Trail**: Avoids data destruction.
2. **Zero UI Clutter**: Satisfies the explicit requirement to avoid building a completed-allotments screen.
3. **Re-allotment Freedom**: The partial index only constrains active statuses, allowing past employees to be allotted again immediately.

---

## ADR 005: Stay Duration Recalculation Baseline (Expected vs. Actual Check-In)

### Status: APPROVED (Stakeholder Confirmed)
### Context:
When an employee arrives on an actual check-in date that differs from their expected check-in date, how should the expected checkout date be computed upon physical check-in confirmation?

### Options Considered:
- **Option 1 (Architect Recommendation - SELECTED)**: Baseline from `actualCheckInDate`.
  $$\text{Expected Checkout} = \text{Actual Check-In} + \text{Planned Stay Duration}$$
  *Rationale*: If an employee arrives 2 days late for a 14-day training course, cutting their stay short by 2 days disrupts their lodging. Physical stay duration is what dictates lodging needs.
- **Option 2 (Strict Booking Window)**: Baseline from `expectedCheckInDate`.
  $$\text{Expected Checkout} = \text{Expected Check-In} + \text{Planned Stay Duration}$$
  *Rationale*: Fixed schedule slot regardless of late arrival.

### Resolution:
Stakeholder explicitly approved **Option 1**: upon manual administrative check-in confirmation, `expectedCheckoutDate` is automatically recalculated from `actualCheckInDate + plannedStayDuration`. Prior to actual check-in, the initial `expectedCheckoutDate` remains calculated from `expectedCheckInDate + plannedStayDuration`.

