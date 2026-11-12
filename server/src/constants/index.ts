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

export enum UserRole {
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum NotificationType {
  UPCOMING = 'UPCOMING',
  DUE_TODAY = 'DUE_TODAY',
  OVERDUE = 'OVERDUE',
}

export const NOTIFICATION_THRESHOLDS = {
  UPCOMING_DAYS: 2,
};
