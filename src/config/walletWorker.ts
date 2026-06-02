import { Worker, Job } from 'bullmq';
import { bullmqConnection } from './bullmq';
import { WalletRepository } from '../modules/wallet/wallet.repository';

const walletRepository = new WalletRepository();

export const walletWorker = new Worker('wallet-creation-queue', async (job: Job) => {
  const { userId } = job.data;
  if (!userId) {
    throw new Error('userId is missing in job data');
  }

  try {
    console.log(`[Worker] Processing wallet creation for user: ${userId}`);
    const existingWallet = await walletRepository.findByUserId(userId);
    if (!existingWallet) {
      await walletRepository.create(userId);
      console.log(`[Worker] Wallet created successfully for user: ${userId}`);
    } else {
      console.log(`[Worker] Wallet already exists for user: ${userId}`);
    }
  } catch (error) {
    console.error(`[Worker] Failed to create wallet for user ${userId}:`, error);
    throw error;
  }
}, { connection: bullmqConnection as any });

walletWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error ${err.message}`);
});
