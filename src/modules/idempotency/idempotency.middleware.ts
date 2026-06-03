import { Request, Response, NextFunction } from 'express';
import { IdempotencyRepository } from './idempotency.repository';
import { container } from 'tsyringe';

export const idempotencyMiddleware = (idempotencyFor: string) => {
  const repository = container.resolve(IdempotencyRepository);

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers['idempotency-key'] as string;

    if (!key) {
      return next();
    }

    try {
      const existingKey = await repository.findByKey(key);
      if (existingKey) {
        return res.status(existingKey.responseStatus).json(existingKey.responseBody);
      }

      const originalJson = res.json;
      res.json = function (body: unknown) {
        // Only save if the status is a success code (e.g., 200, 201)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          repository.create(key, idempotencyFor, res.statusCode, body).catch(console.error);
        }
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
