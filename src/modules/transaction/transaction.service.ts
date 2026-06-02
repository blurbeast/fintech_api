import { TransactionRepository } from './transaction.repository';

export class TransactionService {
  constructor(private transactionRepository: TransactionRepository) {}

  async getTransactions(walletId: string) {
    return this.transactionRepository.findByWalletId(walletId);
  }

  async getTransactionById(id: string) {
    return this.transactionRepository.findById(id);
  }
}
