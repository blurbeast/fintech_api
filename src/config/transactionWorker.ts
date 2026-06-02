import { Worker, Job } from 'bullmq';
import { bullmqConnection } from './bullmq';
import { TransactionRepository } from '../modules/transaction/transaction.repository';
import { TransactionService } from '../modules/transaction/transaction.service';
import { WalletRepository } from '../modules/wallet/wallet.repository';
import { WalletService } from '../modules/wallet/wallet.service';
import { UserRepository } from '../modules/user/user.repository';
import { UserService } from '../modules/user/user.service';

const transactionRepository = new TransactionRepository();
const walletRepository = new WalletRepository();
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const walletService = new WalletService(walletRepository, userService);

const transactionService = new TransactionService(transactionRepository, walletService);

export const transactionWorker = new Worker('transaction-creation-queue', async (job: Job) => {
  const payload = job.data;
  if (!payload || !payload.walletId) {
    throw new Error('Invalid payload in job data');
  }

  try {
    console.log(`[TransactionWorker] Processing transaction creation for wallet: ${payload.walletId}`);
    await transactionService.createTransaction(payload);
    console.log(`[TransactionWorker] Transaction created successfully for wallet: ${payload.walletId}`);
  } catch (error) {
    console.error(`[TransactionWorker] Failed to create transaction for wallet ${payload.walletId}:`, error);
    throw error;
  }
}, { connection: bullmqConnection as any });

transactionWorker.on('failed', (job, err) => {
  console.error(`[TransactionWorker] Job ${job?.id} failed with error ${err.message}`);
});
