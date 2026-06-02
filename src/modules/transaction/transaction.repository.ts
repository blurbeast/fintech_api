import { prisma } from '../../config/prisma';
import { TransactionType, TransactionStatus, Prisma } from '../../../generated/prisma/client';

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
    });
  }

  async findByWalletId(walletId: string) {
    return prisma.transaction.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
