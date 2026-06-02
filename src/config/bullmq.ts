import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from './env';

const connection = new IORedis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
});

export const walletQueue = new Queue('wallet-creation-queue', { connection: connection as any });

export const publishWalletCreationEvent = async (userId: string) => {
  await walletQueue.add('create-wallet', { userId }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  });
};

export const transactionQueue = new Queue('transaction-creation-queue', { connection: connection as any });

export const publishTransactionEvent = async (payload: any) => {
  await transactionQueue.add('create-transaction', payload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  });
};

export const bullmqConnection = connection;
