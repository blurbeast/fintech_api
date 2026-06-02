import { prisma } from '../../config/prisma';
import { TransactionType, TransactionStatus, Prisma } from '@prisma/client';

export class TransactionRepository {
  async create(data: {
    walletId: string;
    type: TransactionType;
    amount: Prisma.Decimal;
    status?: TransactionStatus;
    reference: string;
  }) {
    return prisma.transaction.create({
      data: {
        walletId: data.walletId,
        type: data.type,
        amount: data.amount,
        status: data.status ?? TransactionStatus.PENDING,
        reference: data.reference,
      },
    });
  }

  async findById(id: string) {
    return prisma.transaction.findUnique({
      where: { id },
      include: { wallet: true },
    });
  }

  async findTransactions(filters: { userId?: string; walletId?: string }, skip: number, take: number) {
    const where: any = {};
    if (filters.walletId) {
      where.walletId = filters.walletId;
    }
    if (filters.userId) {
      where.wallet = {
        userId: filters.userId,
      };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ]);

    return { transactions, total, page: Math.floor(skip / take) + 1, limit: take };
  }
}
