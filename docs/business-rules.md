# Business Rules & Concurrency Specification
## Project: Al Haditha Hostel Allotment Management System

---

## 1. Category Allocation Rules

### 1.1. Permanent Category Assignment
- Bootcamps are created with an immutable `category` attribute: `VIP`, `SENIOR`, or `JUNIOR`.
- A bootcamp designated for Juniors cannot be allotted to Seniors or VIPs, and vice versa.
- When an employee is selected for allotment, the system queries available `AllocationUnits` whose `category` strictly matches `employee.category`.

### 1.2. VIP Allocation Rule
- **Target**: An entire Bootcamp building.
- **Unit**: Exactly one `AllocationUnit` with `unitType: 'WHOLE'`.
- **Occupancy Behavior**: When allotted, the entire bootcamp is locked (`isOccupied: true`).
- **Checkout Behavior**: When checkout is confirmed, the entire bootcamp is unlocked.

### 1.3. Senior Allocation Rule
- **Target**: A designated portion within a 2-portion Bootcamp.
- **Units**: Two `AllocationUnits` per bootcamp with `unitType: 'PORTION'`, identified as `Portion A` and `Portion B`.
- **Occupancy Behavior**: Allocating `Portion A` marks only `Portion A` as `isOccupied: true`. `Portion B` remains available for another Senior employee.
- **Checkout Behavior**: Checking out `Portion A` releases only `Portion A`. `Portion B`'s occupant is unaffected.

### 1.4. Junior Allocation Rule
- **Target**: A specific bed within a portion of a Junior Bootcamp.
- **Units**: Six `AllocationUnits` per bootcamp with `unitType: 'BED'`.
  - `Portion A`: `Bed 1`, `Bed 2`, `Bed 3`
  - `Portion B`: `Bed 1`, `Bed 2`, `Bed 3`
- **Occupancy Behavior**: Allocating `Portion A - Bed 2` marks only that bed unit as `isOccupied: true`. The remaining 5 beds remain independently available.
- **Checkout Behavior**: Checking out `Portion A - Bed 2` releases strictly that single bed.

---

## 2. Allotment Suggestion vs. Manual Selection
- **Manual Mode**: The administrator browses all available `AllocationUnits` matching the employee's category and selects an exact unit.
- **System Suggestion Mode**:
  - For **Junior**: Suggests a bed in a partially filled portion first to maximize portion consolidation, or balances density based on organizational preference.
  - For **Senior**: Suggests an empty portion in a partially occupied bootcamp before allocating an empty building.
  - For **VIP**: Suggests any available VIP bootcamp.
- The administrator can always inspect and accept the system-suggested unit or override it with a manual pick.

---

## 3. Stay Calculations & Date Recalculations

### 3.1. Expected Checkout Recalculation
- **Formula**:
  $$\text{Expected Checkout Date} = \text{Start Date} + (\text{Planned Stay Duration in Days})$$
- When an administrator modifies `plannedStayDuration`, the system automatically recomputes `expectedCheckoutDate`.

### 3.2. Check-In Date Shift Rule (Approved & Enforced):
When an administrator confirms physical arrival:
- The administrator records `actualCheckInDate`.
- The system automatically recalculates:
  $$\text{expectedCheckoutDate} = \text{actualCheckInDate} + (\text{plannedStayDuration in Days})$$
- This ensures the employee is afforded the complete duration of their allocated training or assignment, without premature eviction caused by transit delays.
- If the administrator later updates `plannedStayDuration`, the new checkout date recalculates from `actualCheckInDate` (for checked-in allotments) or from `expectedCheckInDate` (for pending allotments).

---

## 4. Notifications Engine Rules

Notifications are computed directly from active allotments (`status === 'CHECKED_IN'`) without a message queue:
- **Upcoming Checkout**:
  $$\text{expectedCheckoutDate} - \text{today} \le 2 \text{ days} \quad \text{and} \quad \text{expectedCheckoutDate} \ge \text{today}$$
- **Checkout Due Today**:
  $$\text{calendarDate}(\text{expectedCheckoutDate}) = \text{calendarDate}(\text{today})$$
- **Overdue Checkout**:
  $$\text{expectedCheckoutDate} < \text{today} \quad \text{and} \quad \text{actualCheckoutDate} \text{ is null}$$

### Non-Automatic Release Invariant:
An allotment that becomes **Overdue** does **NOT** release the allocation unit. The occupant physically retains the bed/room until an administrator confirms checkout.

---

## 5. Concurrency Control & Double-Booking Prevention

### 5.1. Problem Scenario
Two administrators simultaneously attempt to allot the exact same bed (or Senior portion / VIP bootcamp) to two different employees.

### 5.2. Architecture Solution: Two-Layer Defense
1. **Application Layer (MongoDB Multi-Document Transaction with Atomic Conditional Update)**:
   ```typescript
   const session = await mongoose.startSession();
   session.startTransaction();
   try {
     // 1. Atomic reservation test-and-set
     const unit = await AllocationUnit.findOneAndUpdate(
       { _id: allocationUnitId, isOccupied: false },
       { $set: { isOccupied: true, currentAllotmentId: newAllotmentId } },
       { session, new: true }
     );
     
     if (!unit) {
       // Unit already taken by a concurrent transaction
       throw new ConflictError("Selected unit has already been reserved or occupied.");
     }

     // 2. Insert Allotment
     await Allotment.create([allotmentData], { session });

     await session.commitTransaction();
   } catch (err) {
     await session.abortTransaction();
     throw err;
   } finally {
     session.endSession();
   }
   ```
2. **Database Engine Layer (Partial Filter Unique Indexes)**:
   Even in the absence of an explicit transaction, MongoDB's unique index:
   ```json
   {
     "key": { "allocationUnitId": 1 },
     "unique": true,
     "partialFilterExpression": { "status": { "$in": ["PENDING", "CHECKED_IN"] } }
   }
   ```
   physically blocks a second active allotment document from being committed for the same unit with a `11000 Duplicate Key Error`.

