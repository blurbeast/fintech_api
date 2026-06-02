import { WalletRepository } from './wallet.repository';
import { TransactionRepository } from '../transaction/transaction.repository';
import { UserRepository } from '../user/user.repository';
import { prisma } from '../../config/prisma';
import { Prisma, TransactionType, TransactionStatus } from '../../../generated/prisma/client';
import crypto from 'crypto';

export class WalletService {
  constructor(
    private walletRepository: WalletRepository,
    private transactionRepository: TransactionRepository,
    private userRepository: UserRepository
  ) {}

  async fund(userId: string, amount: number) {
    if (amount <= 0) throw new Error('Amount must be greater than 0');

    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) throw new Error('Wallet not found');

    const amountDecimal = new Prisma.Decimal(amount);

    const updatedWallet = await this.walletRepository.updateBalance(wallet.id, amountDecimal);

    const reference = `FUND_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const transaction = await this.transactionRepository.create({
      walletId: wallet.id,
      type: TransactionType.FUND,
      amount: amountDecimal,
      status: TransactionStatus.SUCCESS,
      reference,
    });

    return { wallet: updatedWallet, transaction };
  }

  async transfer(senderId: string, recipientEmail: string, amount: number) {
    if (amount <= 0) throw new Error('Amount must be greater than 0');

    const senderWallet = await this.walletRepository.findByUserId(senderId);
    if (!senderWallet) throw new Error('Sender wallet not found');

    const recipientUser = await this.userRepository.findByEmail(recipientEmail);
    if (!recipientUser) throw new Error('Recipient not found');

    if (recipientUser.id === senderId) throw new Error('Cannot transfer to yourself');

    const recipientWallet = await this.walletRepository.findByUserId(recipientUser.id);
    if (!recipientWallet) throw new Error('Recipient wallet not found');

    const amountDecimal = new Prisma.Decimal(amount);

    if (new Prisma.Decimal(senderWallet.balance).lessThan(amountDecimal)) {
      throw new Error('Insufficient balance');
    }

    const reference = `TXN_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Execute atomic transaction using Prisma
    const [updatedSenderWallet, updatedRecipientWallet, senderTx, recipientTx] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: senderWallet.id },
        data: { balance: { decrement: amountDecimal } },
      }),
      prisma.wallet.update({
        where: { id: recipientWallet.id },
        data: { balance: { increment: amountDecimal } },
      }),
      prisma.transaction.create({
        data: {
          walletId: senderWallet.id,
          type: TransactionType.TRANSFER,
          amount: amountDecimal.negated(),
          status: TransactionStatus.SUCCESS,
          reference: `${reference}_OUT`,
        },
      }),
      prisma.transaction.create({
        data: {
          walletId: recipientWallet.id,
          type: TransactionType.TRANSFER,
          amount: amountDecimal,
          status: TransactionStatus.SUCCESS,
          reference: `${reference}_IN`,
        },
      }),
    ]);

    return {
      message: 'Transfer successful',
      balance: updatedSenderWallet.balance,
      transaction: senderTx,
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

    const updatedWallet = await this.walletRepository.updateBalance(wallet.id, amountDecimal.negated());

    const reference = `WD_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const transaction = await this.transactionRepository.create({
      walletId: wallet.id,
      type: TransactionType.WITHDRAWAL,
      amount: amountDecimal,
      status: TransactionStatus.SUCCESS,
      reference,
    });

    return { wallet: updatedWallet, transaction };
  }

  async getTransactions(userId: string) {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) throw new Error('Wallet not found');

    return this.transactionRepository.findByWalletId(wallet.id);
  }
}
