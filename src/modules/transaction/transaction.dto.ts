import { z } from 'zod';

export const transactionQuerySchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 10)),
  userId: z.string().uuid('Invalid userId format').optional(),
  walletId: z.string().uuid('Invalid walletId format').optional(),
});

export const transactionIdSchema = z.object({
  id: z.string().uuid('Invalid transaction ID format'),
});
