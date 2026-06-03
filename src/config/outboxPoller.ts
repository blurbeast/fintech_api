import { prisma } from './prisma';
import { publishWalletCreationEvent, publishTransactionEvent } from './bullmq';
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
    await prisma.$transaction(async (tx) => {
      // fifo approach for ordering purposes
      // fifo approach so as to capture old stored data
      const events = await tx.$queryRaw<OutboxEvent[]>`
        SELECT * FROM outbox_events 
        WHERE status = 'PENDING' 
        ORDER BY "createdAt" ASC 
        FOR UPDATE SKIP LOCKED 
        LIMIT 100
      `;

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
  } catch (error) {
    console.error('[OutboxPoller] Error polling outbox:', error);
  }
}

// start polling every 2 seconds
cron.schedule('*/2 * * * * *', () => {
  pollOutbox().catch(console.error);
});

console.log('[OutboxPoller] Started background cron poller...');
