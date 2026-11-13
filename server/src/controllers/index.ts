import { Request, Response, NextFunction } from 'express';
import {
  AuthService,
  EmployeeService,
  BootcampService,
  AllotmentService,
  NotificationService,
} from '../services';
import { sendSuccess } from '../utils';

// =================== AUTH CONTROLLER ===================
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    const result = await AuthService.login(username, password);
    sendSuccess(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// =================== EMPLOYEE CONTROLLER ===================
export const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await EmployeeService.createEmployee(req.body);
    sendSuccess(res, employee, 'Employee created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getEmployees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, hasActiveAllotment, search } = req.query;
    const employees = await EmployeeService.getEmployees({
      category: category as any,
      hasActiveAllotment:
        hasActiveAllotment !== undefined ? hasActiveAllotment === 'true' : undefined,
      search: search as string,
    });
    sendSuccess(res, employees);
  } catch (err) {
    next(err);
  }
};

export const getEmployeeById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await EmployeeService.getEmployeeById(req.params.id);
    sendSuccess(res, employee);
  } catch (err) {
    next(err);
  }
};

// =================== BOOTCAMP CONTROLLER ===================
export const createBootcamp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await BootcampService.createBootcamp(req.body);
    sendSuccess(res, result, 'Bootcamp and allocation units created', 201);
  } catch (err) {
    next(err);
  }
};

export const getBootcamps = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, isActive } = req.query;
    const bootcamps = await BootcampService.getBootcamps({
      category: category as any,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
    sendSuccess(res, bootcamps);
  } catch (err) {
    next(err);
  }
};

export const getAvailableUnits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, bootcampId } = req.query;
    const units = await BootcampService.getAvailableUnits(
      category as any,
      bootcampId as string
    );
    sendSuccess(res, units);
  } catch (err) {
    next(err);
  }
};

export const suggestUnit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;
    const suggestion = await BootcampService.suggestUnitForEmployee(category as any);
    sendSuccess(res, suggestion);
  } catch (err) {
    next(err);
  }
};

// =================== ALLOTMENT CONTROLLER ===================
export const createAllotment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allotment = await AllotmentService.createAllotment({
      ...req.body,
      createdById: req.user!.userId,
    });
    sendSuccess(res, allotment, 'Allotment created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const confirmCheckIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { actualCheckInDate } = req.body;
    const allotment = await AllotmentService.confirmCheckIn(
      req.params.id,
      actualCheckInDate,
      req.user!.userId
    );
    sendSuccess(res, allotment, 'Check-in confirmed successfully');
  } catch (err) {
    next(err);
  }
};

export const confirmCheckOut = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { actualCheckoutDate } = req.body;
    const allotment = await AllotmentService.confirmCheckOut(
      req.params.id,
      actualCheckoutDate,
      req.user!.userId
    );
    sendSuccess(res, allotment, 'Check-out confirmed and unit released successfully');
  } catch (err) {
    next(err);
  }
};

export const updateDuration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { plannedStayDuration } = req.body;
    const allotment = await AllotmentService.updateDuration(
      req.params.id,
      plannedStayDuration
    );
    sendSuccess(res, allotment, 'Stay duration updated and checkout recalculated');
  } catch (err) {
    next(err);
  }
};

export const getActiveAllotments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search } = req.query;
    const allotments = await AllotmentService.getActiveAllotments({
      status: status as any,
      search: search as string,
    });
    sendSuccess(res, allotments);
  } catch (err) {
    next(err);
  }
};

export const getRecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;
    const records = await AllotmentService.getRecords({
      search: search as string,
    });
    sendSuccess(res, records);
  } catch (err) {
    next(err);
  }
};

// =================== NOTIFICATION CONTROLLER ===================
export const getNotifications = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await NotificationService.getNotifications();
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export * from './statsController';

