import { Request, Response } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  cacheSeconds = 0
) => {
  if (cacheSeconds > 0) {
    res.setHeader('Cache-Control', `private, max-age=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`);
  }
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  code = 'ERROR',
  details?: any
) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
};

/**
 * Pure date calculation adding days to a date without timezone drift
 */
export const addDays = (startDate: Date, days: number): Date => {
  const result = new Date(startDate);
  result.setDate(result.getDate() + days);
  return result;
};

