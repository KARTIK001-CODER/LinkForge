import { Response } from 'express';
import { z } from 'zod';
import { AppError } from './app-error';

export function handleControllerError(res: Response, error: unknown, context?: string): void {
  if (error instanceof z.ZodError) {
    res.status(400).json({
      success: false,
      errors: error.issues,
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: { code: error.code, message: error.message },
    });
    return;
  }

  if (error && typeof error === 'object' && 'name' in error) {
    const namedError = error as { name: string; message: string };
    if (namedError.name === 'NotFoundError') {
      res.status(404).json({ success: false, message: namedError.message });
      return;
    }
    if (namedError.name === 'InvalidTransitionError' || namedError.name === 'AliasConflictError') {
      res.status(400).json({ success: false, message: namedError.message });
      return;
    }
  }

  if (context) {
    console.error(`[${context}]`, error);
  } else {
    console.error(error);
  }

  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  });
}
