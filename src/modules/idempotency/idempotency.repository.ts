import { prisma } from '../../config/prisma';
import { Prisma } from '@prisma/client';
import { injectable, singleton } from 'tsyringe';

@injectable()
@singleton()
export class IdempotencyRepository {
  async findByKey(key: string) {
    return prisma.idempotencyKey.findUnique({
      where: { key },
    });
  }

  async create(key: string, idempotencyFor: string, responseStatus: number, responseBody: unknown) {
    return prisma.idempotencyKey.create({
      data: {
        key,
        idempotencyFor,
        responseStatus,
        responseBody: responseBody as Prisma.InputJsonValue,
      },
    });
  }
}
