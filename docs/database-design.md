# Database Design Specification
## Project: Al Haditha Hostel Allotment Management System

---

## 1. Overview & Modeling Strategy
The database is hosted on MongoDB Atlas and managed via Mongoose ODM. 

To satisfy the core business rules (independent availability for Senior portions, individual bed availability for Juniors, and whole-building allocation for VIPs), we employ a **Normalized Granular Unit Pattern**:
- Physical buildings are modeled in `bootcamps`.
- Individual bookable assets are modeled in `allocation_units`.
- Stays are recorded in `allotments`.
- People receiving accommodation are recorded in `employees`.
- Administrative operators are recorded in `users`.

This schema guarantees that checking out one Junior employee from Bed 2 of Portion A updates strictly that single `AllocationUnit` without affecting adjoining beds or portions.

---

## 2. Collections & Schema Specifications

### 2.1. `users` Collection (System Administrators)
Stores system administrators who manage allotments.

```typescript
interface IUser {
  _id: Types.ObjectId;
  username: string;          // Unique username / email
  passwordHash: string;      // bcrypt hashed password
  fullName: string;          // Administrator's real name
  role: 'ADMIN' | 'SUPER_ADMIN'; // Privilege level
  isActive: boolean;         // Account status
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `{ username: 1 }` (Unique)

---

### 2.2. `employees` Collection
Stores employee records across VIP, Senior, and Junior tiers.

```typescript
interface IEmployee {
  _id: Types.ObjectId;
  employeeId: string;        // Company unique identifier (e.g. "EMP-1004")
  name: string;              // Full employee name
  category: 'VIP' | 'SENIOR' | 'JUNIOR'; // Category tier
  department?: string;       // Optional department
  contactNumber?: string;    // Contact phone
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `{ employeeId: 1 }` (Unique)
- `{ category: 1 }` (Filtering)

---

### 2.3. `bootcamps` Collection
Represents the physical building infrastructure. Permanently assigned to a category.

```typescript
interface IBootcamp {
  _id: Types.ObjectId;
  bootcampCode: string;      // Unique building identifier (e.g. "BC-VIP-01", "BC-JR-04")
  name: string;              // Human-readable title (e.g., "Block A Junior Bootcamp")
  category: 'VIP' | 'SENIOR' | 'JUNIOR'; // Permanently assigned category
  locationBlock?: string;    // Optional physical zone / sector
  isActive: boolean;         // Building maintenance status
  totalCapacity: number;     // VIP=1, SENIOR=2, JUNIOR=6
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `{ bootcampCode: 1 }` (Unique)
- `{ category: 1, isActive: 1 }` (Compound index for availability searches)

---

### 2.4. `allocation_units` Collection
The fundamental atomic unit of availability. Every bootcamp contains one or more allocation units.

| Category | Units Generated Per Bootcamp | Allocation Unit Type | Portion Identifier | Bed Identifier |
| :--- | :--- | :--- | :--- | :--- |
| **VIP** | 1 Unit | `WHOLE` | `null` | `null` |
| **Senior** | 2 Units | `PORTION` | `Portion A`, `Portion B` | `null` |
| **Junior** | 6 Units | `BED` | `Portion A`, `Portion B` | `Bed 1`, `Bed 2`, `Bed 3` |

```typescript
interface IAllocationUnit {
  _id: Types.ObjectId;
  bootcampId: Types.ObjectId; // Reference to parent Bootcamp
  unitCode: string;           // Canonical unique code (e.g., "BC-JR-01-PA-B1")
  category: 'VIP' | 'SENIOR' | 'JUNIOR'; // Duplicated for fast indexing without joins
  unitType: 'WHOLE' | 'PORTION' | 'BED';
  portionIdentifier?: string | null;     // 'Portion A' or 'Portion B' (null for VIP)
  bedIdentifier?: string | null;         // 'Bed 1', 'Bed 2', 'Bed 3' (null for Senior/VIP)
  isOccupied: boolean;                   // Instant state lock (true = reserved/checked-in)
  currentAllotmentId?: Types.ObjectId | null; // Pointer to active allotment
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `{ unitCode: 1 }` (Unique)
- `{ bootcampId: 1, portionIdentifier: 1, bedIdentifier: 1 }` (Unique compound constraint)
- `{ category: 1, isOccupied: 1 }` (Compound index for lightning-fast availability queries)

---

### 2.5. `allotments` Collection
Tracks the lifecycle of an accommodation assignment.

```typescript
interface IAllotment {
  _id: Types.ObjectId;
  employeeId: Types.ObjectId;       // Ref -> employees
  bootcampId: Types.ObjectId;       // Ref -> bootcamps
  allocationUnitId: Types.ObjectId; // Ref -> allocation_units
  
  // Stay Time Dimensions
  expectedCheckInDate: Date;
  plannedStayDuration: number;      // Days (integer >= 1)
  expectedCheckoutDate: Date;       // Recalculated if duration/start shifts
  
  actualCheckInDate?: Date | null;  // Manually recorded by admin
  actualCheckoutDate?: Date | null; // Manually recorded by admin
  
  // Allotment Lifecycle Status
  status: 'PENDING' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
  
  // Administrative Audit
  createdById: Types.ObjectId;      // Ref -> users
  checkInConfirmedById?: Types.ObjectId | null;
  checkOutConfirmedById?: Types.ObjectId | null;
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- Partial Filter Index to enforce single active allotment per employee:
  ```json
  { 
    "key": { "employeeId": 1 },
    "unique": true,
    "partialFilterExpression": { "status": { "$in": ["PENDING", "CHECKED_IN"] } }
  }
  ```
  *Guarantee*: An employee cannot have more than one active allotment simultaneously.
- Partial Filter Index to prevent double-booking an allocation unit:
  ```json
  {
    "key": { "allocationUnitId": 1 },
    "unique": true,
    "partialFilterExpression": { "status": { "$in": ["PENDING", "CHECKED_IN"] } }
  }
  ```
  *Guarantee*: Two active allotments cannot occupy the same unit simultaneously at the database engine level.
- `{ status: 1, expectedCheckoutDate: 1 }` (Index for notification queries)

---

## 3. Preservation of Historical Checkout Records Without History UI
**Decision Alignment**: The prompt states:
> *"The application must show only active allotments. Do not create a completed-allotments history screen or additional history module. Evaluate how to preserve the actual checkout record without complicating the user-facing system."*

**Solution**:
1. When an allotment is checked out, it is **never deleted**. Its status is transitioned to `COMPLETED` and `actualCheckoutDate` is persisted.
2. The `allocation_units` record has its `isOccupied` set to `false` and `currentAllotmentId` set to `null`.
3. All default application queries on `allotments` filter strictly by:
   ```typescript
   { status: { $in: ['PENDING', 'CHECKED_IN'] } }
   ```
4. This keeps the user-facing application simple, responsive, and completely devoid of historical UI noise, while preserving an immutable checkout record in the database for compliance or reporting.

---

## 4. Sample MongoDB Documents

### 4.1. Sample Junior Bootcamp & Allocation Unit Document
```json
// bootcamps
{
  "_id": { "$oid": "65f1a1000000000000000001" },
  "bootcampCode": "BC-JR-01",
  "name": "Al Haditha Junior Block A",
  "category": "JUNIOR",
  "locationBlock": "Sector 3",
  "totalCapacity": 6,
  "isActive": true
}

// allocation_units (One of 6 units for this bootcamp)
{
  "_id": { "$oid": "65f1a2000000000000000001" },
  "bootcampId": { "$oid": "65f1a1000000000000000001" },
  "unitCode": "BC-JR-01-PA-B1",
  "category": "JUNIOR",
  "unitType": "BED",
  "portionIdentifier": "Portion A",
  "bedIdentifier": "Bed 1",
  "isOccupied": true,
  "currentAllotmentId": { "$oid": "65f1a3000000000000000001" }
}
```

### 4.2. Sample Active Allotment Document
```json
// allotments
{
  "_id": { "$oid": "65f1a3000000000000000001" },
  "employeeId": { "$oid": "65f1a0000000000000000010" },
  "bootcampId": { "$oid": "65f1a1000000000000000001" },
  "allocationUnitId": { "$oid": "65f1a2000000000000000001" },
  "expectedCheckInDate": { "$date": "2026-11-15T00:00:00.000Z" },
  "plannedStayDuration": 14,
  "expectedCheckoutDate": { "$date": "2026-11-29T00:00:00.000Z" },
  "actualCheckInDate": { "$date": "2026-11-15T08:30:00.000Z" },
  "actualCheckoutDate": null,
  "status": "CHECKED_IN",
  "createdById": { "$oid": "65f1a9000000000000000001" }
}
```

