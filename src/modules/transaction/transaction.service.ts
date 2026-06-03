import { TransactionRepository } from './transaction.repository';
import { TransactionType, TransactionStatus, Prisma } from '@prisma/client';
import { injectable, singleton, inject } from 'tsyringe';

@injectable()
@singleton()
export class TransactionService {
  constructor(
    @inject(TransactionRepository) private transactionRepository: TransactionRepository,
  ) {}

  async getTransactions(filters: { userId?: string; walletId?: string }, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return this.transactionRepository.findTransactions(filters, skip, limit);
  }

  async getTransactionById(id: string, userId: string) {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) return null;

    if (transaction.wallet.userId !== userId) {
      throw new Error('Unauthorized to view this transaction');
    }

    return transaction;
  }

  async createTransaction(data: { walletId: string, type: TransactionType, amount: number | Prisma.Decimal, reference: string, status?: TransactionStatus }) {
    return this.transactionRepository.create({
      walletId: data.walletId,
      type: data.type,
      amount: new Prisma.Decimal(data.amount),
      status: data.status || TransactionStatus.SUCCESS,
      reference: data.reference,
    });
  }
}
