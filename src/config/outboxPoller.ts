import { prisma } from './prisma';
import { publishWalletCreationEvent, publishTransactionEvent } from './bullmq';
import cron from 'node-cron';
import { OutboxEvent } from '@prisma/client';

async function pollOutbox() {
  try {
    // skip locked used.
    const events = await prisma.$queryRaw<OutboxEvent[]>`
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
        if (event.topic === 'USER_CREATED') {
          const payload = event.payload as { userId: string };
          await publishWalletCreationEvent(payload.userId);
        } else if (event.topic === 'TRANSACTION_CREATED') {
          const payload = event.payload as any;
          await publishTransactionEvent(payload);
        }

        // mark as processed
        await prisma.$executeRaw`
          UPDATE outbox_events 
          SET status = 'PROCESSED' 
          WHERE id = ${event.id}::uuid
        `;
        console.log(`[OutboxPoller] Successfully processed event: ${event.id}`);
      } catch (error) {
        console.error(`[OutboxPoller] Failed to process event ${event.id}:`, error);
        
        // mark as failed
        await prisma.$executeRaw`
          UPDATE outbox_events 
          SET status = 'FAILED' 
          WHERE id = ${event.id}::uuid
        `;
      }
    }
  } catch (error) {
    console.error('[OutboxPoller] Error polling outbox:', error);
  }
}

// start polling every 2 seconds
cron.schedule('*/2 * * * * *', () => {
  pollOutbox().catch(console.error);
});

console.log('[OutboxPoller] Started background cron poller...');
