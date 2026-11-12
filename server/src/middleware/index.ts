import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import jwt from 'jsonwebtoken';
import { AppError, sendError } from '../utils';
import { config } from '../config/env';

export interface AuthUserPayload {
  userId: string;
  username: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Missing token.', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return next(new AppError('Invalid or expired token.', 401, 'UNAUTHORIZED'));
  }
};

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Replace req with parsed content for strict casting
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query as any;
      if (parsed.params) req.params = parsed.params as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new AppError('Validation failed', 400, 'VALIDATION_ERROR', error.flatten().fieldErrors)
        );
      }
      next(error);
    }
  };
};

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.code, err.details);
    return;
  }

  // Handle Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    const keys = Object.keys(err.keyValue || {}).join(', ');
    sendError(
      res,
      `Duplicate entry violation on field(s): ${keys}`,
      409,
      'CONFLICT',
      err.keyValue
    );
    return;
  }

  console.error('[Unhandled Server Error]:', err);
  sendError(res, 'Internal server error', 500, 'INTERNAL_ERROR');
};

