import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from './env';
import { QUEUES, JOBS } from './constants';

const connection = new IORedis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
});

export const walletQueue = new Queue(QUEUES.WALLET_CREATION, { connection: connection as any });

export const publishWalletCreationEvent = async (userId: string) => {
  await walletQueue.add(JOBS.CREATE_WALLET, { userId }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  });
};

export const transactionQueue = new Queue(QUEUES.TRANSACTION_CREATION, { connection: connection as any });

export const publishTransactionEvent = async (payload: any) => {
  await transactionQueue.add(JOBS.CREATE_TRANSACTION, payload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  });
};

export const bullmqConnection = connection;
