import { prisma } from '../../config/prisma';

export class IdempotencyRepository {
  async findByKey(key: string) {
    return prisma.idempotencyKey.findUnique({
      where: { key },
    });
  }

  async create(key: string, idempotencyFor: string, responseStatus: number, responseBody: any) {
    return prisma.idempotencyKey.create({
      data: {
        key,
        idempotencyFor,
        responseStatus,
        responseBody,
      },
    });
  }
}
