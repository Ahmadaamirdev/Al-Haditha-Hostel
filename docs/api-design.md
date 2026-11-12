# REST API Specification (Contract Design)
## Project: Al Haditha Hostel Allotment Management System
**Base URL**: `/api/v1`

---

## 1. Authentication & Security Headers

All endpoints except `POST /auth/login` require a valid JWT passed in the HTTP Authorization header:
```http
Authorization: Bearer <jwt_token>
```

### Response Codes:
- `200 OK`: Successful retrieval or synchronous operation.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure (detailed Zod issues returned).
- `401 Unauthorized`: Token missing, invalid, or expired.
- `404 Not Found`: Resource ID not found.
- `409 Conflict`: Concurrency conflict (e.g., unit was just occupied by another admin, or employee already has active allotment).
- `500 Internal Server Error`: Unexpected server exception.

---

## 2. API Endpoints Catalog

### 2.1. Authentication (`/auth`)

#### `POST /auth/login`
Authenticates an administrator and returns a JWT token.
- **Request Body**:
```json
{
  "username": "admin@alhaditha.com",
  "password": "Password123!"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "65f1a9000000000000000001",
      "username": "admin@alhaditha.com",
      "fullName": "System Admin",
      "role": "ADMIN"
    }
  }
}
```

---

### 2.2. Employees (`/employees`)

#### `GET /employees`
List employees with category and availability filters.
- **Query Params**:
  - `category` (optional): `VIP` | `SENIOR` | `JUNIOR`
  - `hasActiveAllotment` (optional): `true` | `false`
  - `search` (optional): Search employee name or employee ID.

#### `GET /employees/:id`
Retrieve details of a single employee.

#### `POST /employees`
Register an employee.
- **Request Body**:
```json
{
  "employeeId": "EMP-9021",
  "name": "Ahmed Al-Farsi",
  "category": "SENIOR",
  "department": "Logistics",
  "contactNumber": "+96891234567"
}
```

---

### 2.3. Bootcamps & Allocation Units (`/bootcamps`)

#### `GET /bootcamps`
Lists all bootcamps with summary unit availability metrics.
- **Query Params**: `category`, `isActive`

#### `GET /bootcamps/:id`
Retrieves a specific bootcamp with its associated granular `AllocationUnits`.

#### `GET /bootcamps/units/available`
Fetches available units filtered by category.
- **Query Params**:
  - `category`: `VIP` | `SENIOR` | `JUNIOR` (Required)
  - `bootcampId` (Optional): Filter to units within a specific building.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "allocationUnitId": "65f1a2000000000000000001",
      "unitCode": "BC-SR-01-PA",
      "category": "SENIOR",
      "unitType": "PORTION",
      "portionIdentifier": "Portion A",
      "bedIdentifier": null,
      "bootcamp": {
        "id": "65f1a1000000000000000001",
        "code": "BC-SR-01",
        "name": "Senior Block Alpha"
      }
    }
  ]
}
```

#### `GET /bootcamps/suggestions`
Provides intelligent system-suggested allocation for an employee based on their category.
- **Query Params**: `employeeId` (Required)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "suggestedUnit": {
      "allocationUnitId": "65f1a2000000000000000001",
      "unitCode": "BC-SR-01-PA",
      "category": "SENIOR",
      "unitType": "PORTION",
      "portionIdentifier": "Portion A",
      "bootcampName": "Senior Block Alpha"
    },
    "reason": "Optimal density balance in Senior Block Alpha"
  }
}
```

---

### 2.4. Allotments (`/allotments`)

#### `GET /allotments`
Retrieves **active allotments only** (`status: PENDING` or `CHECKED_IN`).
- **Query Params**:
  - `status` (optional): `PENDING` | `CHECKED_IN`
  - `category` (optional): `VIP` | `SENIOR` | `JUNIOR`
  - `search` (optional): Filter by employee name/ID or bootcamp code.

#### `POST /allotments`
Creates a new allotment. Employs atomic reservation to prevent double-booking.
- **Request Body**:
```json
{
  "employeeId": "65f1a0000000000000000010",
  "allocationUnitId": "65f1a2000000000000000001",
  "expectedCheckInDate": "2026-11-20T00:00:00.000Z",
  "plannedStayDuration": 10,
  "notes": "Scheduled training assignment"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "data": {
    "id": "65f1a3000000000000000099",
    "status": "PENDING",
    "expectedCheckInDate": "2026-11-20T00:00:00.000Z",
    "plannedStayDuration": 10,
    "expectedCheckoutDate": "2026-11-30T00:00:00.000Z",
    "unitCode": "BC-SR-01-PA"
  }
}
```

#### `PATCH /allotments/:id/check-in`
Manual check-in confirmation by the administrator.
- **Request Body**:
```json
{
  "actualCheckInDate": "2026-11-20T09:15:00.000Z"
}
```

#### `PATCH /allotments/:id/check-out`
Manual checkout confirmation by the administrator. Atomically marks allotment as `COMPLETED` and releases the `AllocationUnit`.
- **Request Body**:
```json
{
  "actualCheckoutDate": "2026-11-30T10:00:00.000Z"
}
```

#### `PATCH /allotments/:id/duration`
Extends or reduces the stay duration, triggering automatic recalculation of the expected checkout date.
- **Request Body**:
```json
{
  "plannedStayDuration": 15
}
```

---

### 2.5. Notifications (`/notifications`)

#### `GET /notifications`
Calculates real-time active allotment notifications.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "upcomingCount": 2,
      "dueTodayCount": 1,
      "overdueCount": 1
    },
    "alerts": [
      {
        "type": "OVERDUE",
        "allotmentId": "65f1a3000000000000000050",
        "employeeName": "Khalfan Al-Balushi",
        "employeeId": "EMP-3042",
        "unitCode": "BC-JR-02-PB-B2",
        "expectedCheckoutDate": "2026-11-10T00:00:00.000Z",
        "daysOverdue": 2
      },
      {
        "type": "DUE_TODAY",
        "allotmentId": "65f1a3000000000000000077",
        "employeeName": "Rashid Al-Mamari",
        "employeeId": "EMP-8821",
        "unitCode": "BC-VIP-03-UNIT",
        "expectedCheckoutDate": "2026-11-12T00:00:00.000Z"
      },
      {
        "type": "UPCOMING",
        "allotmentId": "65f1a3000000000000000088",
        "employeeName": "Salim Al-Harthy",
        "employeeId": "EMP-4112",
        "unitCode": "BC-SR-01-PB",
        "expectedCheckoutDate": "2026-11-14T00:00:00.000Z",
        "daysRemaining": 2
      }
    ]
  }
}
```

