import { Request, Response, NextFunction } from 'express';
import { IdempotencyRepository } from './idempotency.repository';
import { container } from 'tsyringe';

export const idempotencyMiddleware = (idempotencyFor: string) => {
  const repository = container.resolve(IdempotencyRepository);

  return async (req: Request, res: Response, next: NextFunction) => {
    const rawKey = req.headers['idempotency-key'] as string;

    if (!rawKey) {
      return next();
    }

    const userId = (req as any).user?.userId;
    const key = `${userId}:${rawKey}`;

    try {
      const existingKey = await repository.findByKey(key);
      if (existingKey) {
        res.setHeader('X-Idempotent-Replayed', 'true');
        return res.status(existingKey.responseStatus).json(existingKey.responseBody);
      }

      const originalJson = res.json;
      res.json = function (body: unknown) {
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
