import { WalletRepository } from './wallet.repository';
import { UserService } from '../user/user.service';
import { prisma } from '../../config/prisma';
import { Prisma, TransactionType } from '@prisma/client';
import crypto from 'crypto';
import { injectable, singleton, inject } from 'tsyringe';
import { TOPICS } from '../../config/constants';
import { AppError } from '../../shared/utils/AppError';

@injectable()
@singleton()
export class WalletService {
  constructor(
    @inject(WalletRepository) private walletRepository: WalletRepository,
    @inject(UserService) private userService: UserService
  ) {}

  private generateReference(prefix: string): string {
    return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  async getWalletByUserId(userId: string) {
    const wallet = await this.walletRepository.findByUserId(userId);

    if (!wallet) throw new AppError('user wallet not found', 404);
    
    return wallet;
  }

  async fund(userId: string, amount: number) {
    if (amount <= 0) throw new AppError('Amount must be greater than 0', 400);

    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) throw new AppError('Wallet not found', 404);

    const amountDecimal = new Prisma.Decimal(amount);
    const reference = this.generateReference('FUND');

    const updatedWallet = await prisma.$transaction(async (tx) => {
      const [lockedWallet] = await tx.$queryRaw<{ balance: Prisma.Decimal }[]>`
        SELECT balance FROM wallets WHERE id = ${wallet.id}::uuid FOR UPDATE
      `;

      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amountDecimal } },
      });

      await tx.outboxEvent.create({
        data: {
          topic: TOPICS.TRANSACTION_CREATED,
          payload: {
            walletId: wallet.id,
            type: TransactionType.FUND,
            amount: amountDecimal.toNumber(),
            reference,
          },
        },
      });

      return updated;
    });

    return { 
      message: 'Wallet funded successfully',
      data: { wallet: updatedWallet, reference }
    };
  }

  async transfer(senderId: string, recipientEmail: string, amount: number) {
    if (amount <= 0) throw new AppError('Amount must be greater than 0', 400);

    const senderWallet = await this.walletRepository.findByUserId(senderId);
    if (!senderWallet) throw new AppError('Sender wallet not found', 404);

    const recipientUser = await this.userService.getUserByEmail(recipientEmail);
    if (recipientUser.id === senderId) throw new AppError('Cannot transfer to yourself', 400);

    const recipientWallet = await this.walletRepository.findByUserId(recipientUser.id);
    if (!recipientWallet) throw new AppError('Recipient wallet not found', 404);

    const amountDecimal = new Prisma.Decimal(amount);
    const reference = this.generateReference('TXN');

    const updatedSenderWallet = await prisma.$transaction(async (tx) => {
      const [lockedSender] = await tx.$queryRaw<{ balance: Prisma.Decimal }[]>`
        SELECT balance FROM wallets WHERE id = ${senderWallet.id}::uuid FOR UPDATE
      `;

      if (new Prisma.Decimal(lockedSender.balance).lessThan(amountDecimal)) {
        throw new AppError('Insufficient balance', 400);
      }

      const updated = await tx.wallet.update({
        where: { id: senderWallet.id },
        data: { balance: { decrement: amountDecimal } },
      });

      await tx.wallet.update({
        where: { id: recipientWallet.id },
        data: { balance: { increment: amountDecimal } },
      });

      await tx.outboxEvent.create({
        data: {
          topic: TOPICS.TRANSACTION_CREATED,
          payload: {
            walletId: senderWallet.id,
            type: TransactionType.TRANSFER_OUT,
            amount: amountDecimal.negated().toNumber(),
            reference: `${reference}_OUT`,
          },
        },
      });

      await tx.outboxEvent.create({
        data: {
          topic: TOPICS.TRANSACTION_CREATED,
          payload: {
            walletId: recipientWallet.id,
            type: TransactionType.TRANSFER_IN,
            amount: amountDecimal.toNumber(),
            reference: `${reference}_IN`,
          },
        },
      });

      return updated;
    });

    return {
      message: 'Transfer queued successfully',
      balance: updatedSenderWallet.balance,
      reference,
    };
  }

  async withdraw(userId: string, amount: number) {
    if (amount <= 0) throw new AppError('Amount must be greater than 0', 400);

    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) throw new AppError('Wallet not found', 404);

    const amountDecimal = new Prisma.Decimal(amount);
    const reference = this.generateReference('WD');

    const updatedWallet = await prisma.$transaction(async (tx) => {
      const [lockedWallet] = await tx.$queryRaw<{ balance: Prisma.Decimal }[]>`
        SELECT balance FROM wallets WHERE id = ${wallet.id}::uuid FOR UPDATE
      `;

      if (new Prisma.Decimal(lockedWallet.balance).lessThan(amountDecimal)) {
        throw new AppError('Insufficient balance', 400);
      }

      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amountDecimal } },
      });

      await tx.outboxEvent.create({
        data: {
          topic: TOPICS.TRANSACTION_CREATED,
          payload: {
            walletId: wallet.id,
            type: TransactionType.WITHDRAWAL,
            amount: amountDecimal.negated().toNumber(),
            reference,
          },
        },
      });

      return updated;
    });

    return { 
      message: 'Withdrawal successful',
      data: { wallet: updatedWallet, reference }
    };
  }
}
