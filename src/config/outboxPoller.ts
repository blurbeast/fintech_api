import { prisma } from './prisma';
import { publishWalletCreationEvent } from './bullmq';
import cron from 'node-cron';

async function pollOutbox() {
  try {
    // We use a raw query with FOR UPDATE SKIP LOCKED to safely fetch events in a concurrent environment
    const events = await prisma.$queryRaw<any[]>`
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
          await publishWalletCreationEvent(event.payload.userId);
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
