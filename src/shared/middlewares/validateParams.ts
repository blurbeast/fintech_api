import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

export const validateParams = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          details: error.issues,
        });
      }
      next(error);
    }
  };
};
