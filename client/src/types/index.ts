export enum EmployeeCategory {
  VIP = 'VIP',
  SENIOR = 'SENIOR',
  JUNIOR = 'JUNIOR',
}

export enum AllocationUnitType {
  WHOLE = 'WHOLE',
  PORTION = 'PORTION',
  BED = 'BED',
}

export enum AllotmentStatus {
  PENDING = 'PENDING',
  CHECKED_IN = 'CHECKED_IN',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum NotificationType {
  UPCOMING = 'UPCOMING',
  DUE_TODAY = 'DUE_TODAY',
  OVERDUE = 'OVERDUE',
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

export interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  category: EmployeeCategory;
  department?: string;
  contactNumber?: string;
  hasActiveAllotment?: boolean;
  activeAllotment?: any;
  createdAt: string;
  updatedAt: string;
}

export interface AllocationUnit {
  _id: string;
  bootcampId: string;
  unitCode: string;
  category: EmployeeCategory;
  unitType: AllocationUnitType;
  portionIdentifier?: string | null;
  bedIdentifier?: string | null;
  isOccupied: boolean;
  currentAllotmentId?: any;
}

export interface Bootcamp {
  _id: string;
  bootcampCode: string;
  name: string;
  category: EmployeeCategory;
  locationBlock?: string;
  totalCapacity: number;
  occupiedCount: number;
  availableCount: number;
  isActive: boolean;
  units?: AllocationUnit[];
}

export interface Allotment {
  _id: string;
  employeeId: Employee;
  bootcampId: Bootcamp;
  allocationUnitId: AllocationUnit;
  expectedCheckInDate: string;
  plannedStayDuration: number;
  expectedCheckoutDate: string;
  actualCheckInDate?: string | null;
  actualCheckoutDate?: string | null;
  status: AllotmentStatus;
  notes?: string;
  createdById?: any;
  createdAt: string;
}

export interface NotificationItem {
  type: NotificationType;
  allotmentId: string;
  employee: {
    _id: string;
    employeeId: string;
    name: string;
    category: EmployeeCategory;
    contactNumber?: string;
  };
  bootcamp: {
    _id: string;
    bootcampCode: string;
    name: string;
  };
  unit: {
    _id: string;
    unitCode: string;
    portionIdentifier?: string | null;
    bedIdentifier?: string | null;
  };
  expectedCheckoutDate: string;
  actualCheckInDate?: string;
  daysRemaining?: number;
  daysOverdue?: number;
}
