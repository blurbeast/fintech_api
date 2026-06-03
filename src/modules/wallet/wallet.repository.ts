import { injectable, singleton } from 'tsyringe';
import { prisma } from '../../config/prisma';
import { Prisma } from '@prisma/client';

@injectable()
@singleton()
export class WalletRepository {
  async create(userId: string) {
    return prisma.wallet.create({
      data: { userId },
    });
  }

  async findByUserId(userId: string) {
    return prisma.wallet.findUnique({
      where: { userId },
    });
  }

  async updateBalance(walletId: string, amount: Prisma.Decimal) {
    return prisma.wallet.update({
      where: { id: walletId },
      data: {
        balance: {
          increment: amount,
        },
      },
    });
  }
}
