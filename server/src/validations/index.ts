import { z } from 'zod';
import { EmployeeCategory } from '../constants';

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const createEmployeeSchema = z.object({
  body: z.object({
    employeeId: z.string().min(2, 'Employee ID is required'),
    name: z.string().min(2, 'Name is required'),
    category: z.nativeEnum(EmployeeCategory),
    department: z.string().optional(),
    contactNumber: z.string().optional(),
  }),
});

export const createBootcampSchema = z.object({
  body: z.object({
    bootcampCode: z.string().min(2, 'Bootcamp code is required'),
    name: z.string().min(2, 'Name is required'),
    category: z.nativeEnum(EmployeeCategory),
    locationBlock: z.string().optional(),
  }),
});

export const createAllotmentSchema = z.object({
  body: z.object({
    employeeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Employee ID'),
    allocationUnitId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Allocation Unit ID'),
    expectedCheckInDate: z.string().datetime({ message: 'Invalid ISO date string' }),
    plannedStayDuration: z.number().int().min(1, 'Duration must be at least 1 day'),
    notes: z.string().optional(),
  }),
});

export const checkInSchema = z.object({
  body: z.object({
    actualCheckInDate: z.string().datetime({ message: 'Invalid ISO date string' }),
  }),
});

export const checkOutSchema = z.object({
  body: z.object({
    actualCheckoutDate: z.string().datetime({ message: 'Invalid ISO date string' }),
  }),
});

export const updateDurationSchema = z.object({
  body: z.object({
    plannedStayDuration: z.number().int().min(1, 'Duration must be at least 1 day'),
  }),
});

