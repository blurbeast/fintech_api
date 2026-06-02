import { WalletRepository } from './wallet.repository';
import { TransactionService } from '../transaction/transaction.service';
import { UserService } from '../user/user.service';
import { prisma } from '../../config/prisma';
import { Prisma, TransactionType } from '@prisma/client';
import crypto from 'crypto';

export class WalletService {
  constructor(
    private walletRepository: WalletRepository,
    private userService: UserService
  ) {}

  async getWalletByUserId(userId: string) {
    return this.walletRepository.findByUserId(userId);
  }

  async fund(userId: string, amount: number) {
    if (amount <= 0) throw new Error('Amount must be greater than 0');

    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) throw new Error('Wallet not found');

    const amountDecimal = new Prisma.Decimal(amount);
    const reference = `FUND_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const [updatedWallet] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amountDecimal } },
      }),
      prisma.outboxEvent.create({
        data: {
          topic: 'TRANSACTION_CREATED',
          payload: {
            walletId: wallet.id,
            type: TransactionType.FUND,
            amount: amountDecimal.toNumber(),
            reference,
          },
        },
      }),
    ]);

    return { wallet: updatedWallet, reference };
  }

  async transfer(senderId: string, recipientEmail: string, amount: number) {
    if (amount <= 0) throw new Error('Amount must be greater than 0');

    const senderWallet = await this.walletRepository.findByUserId(senderId);
    if (!senderWallet) throw new Error('Sender wallet not found');

    const recipientUser = await this.userService.getUserByEmail(recipientEmail);
    if (recipientUser.id === senderId) throw new Error('Cannot transfer to yourself');

    const recipientWallet = await this.walletRepository.findByUserId(recipientUser.id);
    if (!recipientWallet) throw new Error('Recipient wallet not found');

    const amountDecimal = new Prisma.Decimal(amount);

    if (new Prisma.Decimal(senderWallet.balance).lessThan(amountDecimal)) {
      throw new Error('Insufficient balance');
    }

    const reference = `TXN_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const [updatedSenderWallet] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: senderWallet.id },
        data: { balance: { decrement: amountDecimal } },
      }),
      prisma.wallet.update({
        where: { id: recipientWallet.id },
        data: { balance: { increment: amountDecimal } },
      }),
      prisma.outboxEvent.create({
        data: {
          topic: 'TRANSACTION_CREATED',
          payload: {
            walletId: senderWallet.id,
            type: TransactionType.TRANSFER,
            amount: amountDecimal.negated().toNumber(),
            reference: `${reference}_OUT`,
          },
        },
      }),
      prisma.outboxEvent.create({
        data: {
          topic: 'TRANSACTION_CREATED',
          payload: {
            walletId: recipientWallet.id,
            type: TransactionType.TRANSFER,
            amount: amountDecimal.toNumber(),
            reference: `${reference}_IN`,
          },
        },
      }),
    ]);

    return {
      message: 'Transfer queued successfully',
      balance: updatedSenderWallet.balance,
      reference,
    };
  }

  async withdraw(userId: string, amount: number) {
    if (amount <= 0) throw new Error('Amount must be greater than 0');

    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) throw new Error('Wallet not found');

    const amountDecimal = new Prisma.Decimal(amount);

    if (new Prisma.Decimal(wallet.balance).lessThan(amountDecimal)) {
      throw new Error('Insufficient balance');
    }

    const reference = `WD_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const [updatedWallet] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amountDecimal } },
      }),
      prisma.outboxEvent.create({
        data: {
          topic: 'TRANSACTION_CREATED',
          payload: {
            walletId: wallet.id,
            type: TransactionType.WITHDRAWAL,
            amount: amountDecimal.toNumber(),
            reference,
          },
        },
      }),
    ]);

    return { wallet: updatedWallet, reference };
  }
}
