import { prisma } from './prisma';
import { publishWalletCreationEvent, publishTransactionEvent } from './bullmq';
import { env } from './env';
import cron from 'node-cron';
import { TOPICS } from './constants';
import { OutboxEvent, Prisma } from '@prisma/client';

type TopicHandler = (payload: any) => Promise<void>;

const topicHandlers: Record<string, TopicHandler> = {
  [TOPICS.USER_CREATED]: async (payload: { userId: string }) => {
    await publishWalletCreationEvent(payload.userId);
  },
  [TOPICS.TRANSACTION_CREATED]: async (payload: any) => {
    await publishTransactionEvent(payload);
  }
};

async function updateEventStatus(eventId: string, status: 'PROCESSED' | 'FAILED', tx?: Prisma.TransactionClient) {
  const dbTx = tx ?? prisma;
  if (status === 'PROCESSED') {
    await dbTx.$executeRaw`
      UPDATE outbox_events 
      SET status = 'PROCESSED' 
      WHERE id = ${eventId}::uuid
    `;
  } else {
    await dbTx.$executeRaw`
      UPDATE outbox_events 
      SET status = 'FAILED' 
      WHERE id = ${eventId}::uuid
    `;
  }
}

async function pollOutbox() {
  try {
    let processedCount = 0;

    await prisma.$transaction(async (tx) => {
      // fifo approach for ordering purposes
      // Use env limit
      const events = await tx.$queryRawUnsafe<OutboxEvent[]>(`
        SELECT * FROM outbox_events 
        WHERE status = 'PENDING' 
        ORDER BY "createdAt" ASC 
        FOR UPDATE SKIP LOCKED 
        LIMIT $1
      `, env.OUTBOX_POLL_LIMIT);

      processedCount = events.length;
      if (events.length === 0) return;

      for (const event of events) {
        console.log(`[OutboxPoller] Processing event: ${event.id} - ${event.topic}`);

        try {
          const handler = topicHandlers[event.topic];
          if (handler) {
            await handler(event.payload);
          } else {
            console.warn(`[OutboxPoller] No handler found for topic: ${event.topic}`);
          }

          // mark as processed within the same transaction
          await updateEventStatus(event.id, 'PROCESSED', tx);
          console.log(`[OutboxPoller] Successfully processed event: ${event.id}`);
        } catch (error) {
          console.error(`[OutboxPoller] Failed to process event ${event.id}:`, error);

          // mark as failed within the same transaction
          await updateEventStatus(event.id, 'FAILED', tx);
        }
      }
    });

    return processedCount;
  } catch (error) {
    console.error('[OutboxPoller] Error polling outbox:', error);
    return 0;
  }
}

let isPolling = false;

async function runPoller() {
  if (isPolling) return;
  
  isPolling = true;
  try {
    const processedCount = await pollOutbox();
    if (processedCount === env.OUTBOX_POLL_LIMIT) {
      isPolling = false;
      setImmediate(runPoller);
      return;
    }
  } catch (err) {
    console.error('[OutboxPoller] Unhandled error during polling loop:', err);
  } finally {
    isPolling = false;
  }
}

cron.schedule(env.OUTBOX_POLL_CRON, () => {
  runPoller().catch(console.error);
});

console.log(`[OutboxPoller] Started background cron poller (Cron: ${env.OUTBOX_POLL_CRON}, Limit: ${env.OUTBOX_POLL_LIMIT})...`);
