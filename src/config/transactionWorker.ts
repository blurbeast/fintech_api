import { Worker, Job } from 'bullmq';
import { bullmqConnection } from './bullmq';
import { container } from 'tsyringe';
import { QUEUES } from './constants';
import { TransactionService } from '../modules/transaction/transaction.service';

const transactionService = container.resolve(TransactionService);

export const transactionWorker = new Worker(QUEUES.TRANSACTION_CREATION, async (job: Job) => {
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
