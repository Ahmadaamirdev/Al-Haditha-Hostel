# Business Requirements Document (BRD)
## Project: Al Haditha Hostel Allotment Management System

---

## 1. Executive Summary & Purpose
The **Al Haditha Hostel Allotment Management System** is an enterprise management platform designed to automate and govern accommodation allocations across specialized accommodation units (termed **Bootcamps**) for workforce members across three designated seniority categories: **VIP**, **Senior**, and **Junior**. 

The system enforces capacity limits, independent granular availability, stay tracking, and checkout workflows while maintaining high auditability and preventing concurrency errors (e.g., race conditions between multiple administrative users).

---

## 2. Stakeholders & Personas
- **System Administrator / Hostel Warden**: The primary operator who creates and updates allotments, logs physical check-ins, performs manual checkouts, adjusts durations, and monitors notifications.
- **Auditor / HR Lead**: Reviews allocation density, ensures that Senior and Junior employees are allotted only within their assigned category boundaries, and inspects occupancy.
- **Workforce / Employees**: Beneficiaries of the allotment. Categorized as VIP, Senior, or Junior.

---

## 3. Employee Categorization & Accommodation Hierarchy

Accommodation units are divided into physical structures called **Bootcamps**. Bootcamps are **permanently dedicated** to a specific category of employees and cannot be dynamically converted on an ad-hoc basis.

### 3.1. VIP Category
- **Allocation Rule**: One entire bootcamp is assigned to exactly **one VIP employee**.
- **Structural Unit**: **WHOLE**.
- **Granularity**: Neither portion nor bed division exists.
- **Capacity**: 1 person per bootcamp.
- **Availability & Release**: Availability is binary for the entire bootcamp. When a VIP checks out, the entire bootcamp is released immediately.

### 3.2. Senior Category
- **Allocation Rule**: One senior bootcamp accommodates **two Senior employees**.
- **Structural Unit**: **PORTION**.
- **Internal Division**: Exactly two independent portions per bootcamp (e.g., Portion A, Portion B).
- **Capacity**: 1 Senior employee per portion (total capacity = 2).
- **Availability & Release**: Each portion operates with complete autonomy. The allotment or checkout of Portion A must have zero impact on Portion B's availability status.

### 3.3. Junior Category
- **Allocation Rule**: One junior bootcamp accommodates **six Junior employees**.
- **Structural Unit**: **BED**.
- **Internal Division**: Exactly two portions per bootcamp (Portion A, Portion B); each portion contains exactly three individual beds (Bed 1, Bed 2, Bed 3).
- **Capacity**: 1 Junior employee per bed (total capacity = 6).
- **Availability & Release**: Availability is managed at the granular bed level. When a junior checks out, only that specific bed is released; the remaining 5 beds remain completely unaffected.

---

## 4. Core Business Rules & Invariants

1. **Category Matching Invariant**:
   - An employee in category `X` can ONLY be allotted to an `AllocationUnit` belonging to a bootcamp of category `X`. Cross-category assignments are strictly prohibited.
2. **Single Active Allotment Invariant**:
   - An employee must NOT possess more than one active allotment (`PENDING` or `CHECKED_IN`) at any given time.
   - Once an allotment reaches `COMPLETED` (or `CANCELLED`), the employee becomes eligible for a subsequent allotment.
3. **Unit-Level Granular Availability**:
   - Availability is computed and tracked exclusively at the atomic `AllocationUnit` level (`WHOLE`, `PORTION`, `BED`), never solely by coarse bootcamp occupancy.
4. **Manual Administrative Confirmation**:
   - System never performs automatic check-in or automatic checkout. Physical arrival and departure require explicit administrator verification and data entry.
5. **No Auto-Release on Date Expiry**:
   - If an expected checkout date passes without the employee leaving, the allocation unit **remains occupied/reserved**. Only explicit administrator checkout releases the space.

---

## 5. Stay Management Requirements

Every allotment lifecycle tracks distinct temporal milestones:
- **Expected Check-In Date**: Scheduled start date requested/planned.
- **Planned Stay Duration**: Integer number of days planned for the accommodation.
- **Expected Checkout Date**: Computed target date of departure (`Expected Check-In + Planned Stay Duration`).
- **Actual Check-In Date**: Timestamp recorded when the administrator confirms physical arrival.
- **Actual Checkout Date**: Timestamp recorded when the administrator confirms physical departure.
- **Status Lifecycle**:
  - `PENDING`: Allotment created, unit reserved, employee not yet arrived.
  - `CHECKED_IN`: Employee confirmed arrived by admin; stay active.
  - `COMPLETED`: Employee checked out by admin; unit released.
  - `CANCELLED`: Allotment terminated before check-in; unit released.

### Duration Modifications:
- Administrators can increase or decrease the planned stay duration.
- Whenever stay duration is adjusted, the expected checkout date must be recalculated.

---

## 6. Notification Rules
The system calculates real-time notifications on the fly without introducing external polling queues or push message brokers:
1. **Upcoming Checkout**: Active allotment (`CHECKED_IN`) where `Expected Checkout Date - Today <= 2 days` (configurable threshold).
2. **Checkout Due Today**: Active allotment (`CHECKED_IN`) where the calendar date of `Expected Checkout Date` equals today's calendar date.
3. **Overdue Checkout**: Active allotment (`CHECKED_IN`) where `Expected Checkout Date < Today` and `Actual Checkout Date` is null.

---

## 7. Scope Boundaries & Limitations

### 7.1. In-Scope (Phase 1 Foundation & Subsequent Core Phases)
- Data schemas and constraints for Employees, Bootcamps, AllocationUnits, Allotments, and Users.
- Atomic concurrency safety for allocations.
- Filtered active-allotments views.
- Real-time stay calculations and notifications based on status/dates.

### 7.2. Out-of-Scope (Strictly Excluded)
- **Completed-Allotments History Screen**: The user-facing application must only display active allotments. Historical checkout records are preserved in the database for audit integrity, but no UI history module will be built.
- **Public/Self-Service Portals**: Employees do not log in; only administrators interact with the system.
- **Billing / Financial Invoicing**: No billing, payment gateways, or rent deduction mechanisms.
- **Microservices & Event Brokers**: Monolithic modular architecture with direct MongoDB transactional integrity.

---

## 8. Unresolved Decisions & Business Recommendations

### 8.1. Pending Decision: Stay Duration Recalculation Origin
- **The Issue**: When an employee physically checks in on a date different from their `Expected Check-In Date` (e.g., arrived 2 days late), does the stay duration calculation begin from:
  1. The **Expected Check-In Date** (contractual booking period)?
  2. The **Actual Confirmed Check-In Date** (actual physical occupation)?
- **Architectural Recommendation**: Use the **Actual Confirmed Check-In Date** as the starting point upon confirmation (`Expected Checkout = Actual Check-In + Planned Stay Duration`), because hostel accommodation capacity is tied to physical presence, preventing artificial early checkouts.
- **Current Status**: **PENDING FORMAL CLIENT APPROVAL**. The data schema preserves both `expectedCheckInDate` and `actualCheckInDate` independently to accommodate either decision seamlessly.
